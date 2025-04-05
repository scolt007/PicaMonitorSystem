import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { addMonths, subMonths, format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth, isToday, parseISO } from "date-fns";
import PieChart from "@/components/charts/PieChart";
import BarChart from "@/components/charts/BarChart";
import StatusBadge from "@/components/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";
import { PicaWithRelations } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar, AlertCircle, CheckCircle, Clock, Edit } from "lucide-react";
import { Input } from "@/components/ui/input";
import * as HoverCard from '@radix-ui/react-hover-card';
import { Link } from "wouter";

const Dashboard: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState("all");
  
  // Set default date range from beginning of current month to today
  const [dateRange, setDateRange] = useState(() => { 
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    return {
      start: format(startOfMonth, "yyyy-MM-dd"),
      end: format(today, "yyyy-MM-dd")
    };
  });
  
  // States for the calendar
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Previous Month
  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };
  
  // Next Month
  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };
  
  // Define stat types
  type StatusStats = {
    progress: number;
    complete: number;
    overdue: number;
    total: number;
  };
  
  type DeptStat = {
    department: string;
    progress: number;
    complete: number;
    overdue: number;
  };
  
  type SiteStat = {
    site: string;
    progress: number;
    complete: number;
    overdue: number;
  };

  // Fetch PICAs stats and data
  const { data: stats, isLoading: statsLoading } = useQuery<StatusStats>({ 
    queryKey: ['/api/picas/stats'],
  });
  
  // Load department statistics
  const { data: deptStats, isLoading: deptStatsLoading } = useQuery<DeptStat[]>({ 
    queryKey: ['/api/picas/stats/department'],
  });
  
  // Load site statistics
  const { data: siteStats, isLoading: siteStatsLoading } = useQuery<SiteStat[]>({ 
    queryKey: ['/api/picas/stats/site'],
  });
  
  // Load all PICAs with relations
  const { data: picas, isLoading: picasLoading } = useQuery<PicaWithRelations[]>({ 
    queryKey: ['/api/picas'],
  });
  
  // Calendar calculations
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({
    start: monthStart,
    end: monthEnd,
  });
  
  // Get day of week for the first day (0 = Sunday, 1 = Monday, etc.)
  const startDay = getDay(monthStart);
  
  // Filter PICAs for current month
  const picasInMonth = picas?.filter((pica: PicaWithRelations) => {
    const picaDate = parseISO(pica.date);
    const picaDueDate = parseISO(pica.dueDate);
    return isSameMonth(picaDate, currentMonth) || isSameMonth(picaDueDate, currentMonth);
  });

  // Get PICAs for a specific day
  const getPicasForDay = (day: Date) => {
    if (!picasInMonth) return [];
    
    return picasInMonth.filter((pica: PicaWithRelations) => {
      const picaDate = parseISO(pica.date);
      const picaDueDate = parseISO(pica.dueDate);
      
      const isSameDay = (date1: Date, date2: Date) => {
        return date1.getDate() === date2.getDate() && 
               date1.getMonth() === date2.getMonth() && 
               date1.getFullYear() === date2.getFullYear();
      };
      
      return isSameDay(picaDate, day) || isSameDay(picaDueDate, day);
    });
  };

  // Determine if a PICA is created or due on a specific day
  const isPicaCreated = (pica: PicaWithRelations, day: Date) => {
    const picaDate = parseISO(pica.date);
    return picaDate.getDate() === day.getDate() && 
           picaDate.getMonth() === day.getMonth() && 
           picaDate.getFullYear() === day.getFullYear();
  };
  
  // Get background color based on PICA status and whether it's the creation or due date
  const getPicaBackgroundColor = (pica: PicaWithRelations, day: Date) => {
    const isCreationDay = isPicaCreated(pica, day);
    
    if (isCreationDay) {
      return "bg-yellow-300 text-black"; // Creation date is always yellow
    } else {
      // For due date, color based on status
      switch (pica.status) {
        case 'complete':
          return "bg-green-500 text-white";
        case 'overdue':
          return "bg-red-500 text-white";
        case 'progress':
        default:
          return "bg-blue-500 text-white";
      }
    }
  };
  
  // Get the appropriate icon based on PICA status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete':
        return <CheckCircle className="w-3 h-3 text-green-500" />;
      case 'overdue':
        return <AlertCircle className="w-3 h-3 text-red-500" />;
      case 'progress':
      default:
        return <Clock className="w-3 h-3 text-blue-500" />;
    }
  };

  // Handle date range change
  const handleDateChange = (field: 'start' | 'end', value: string) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }));
    
    // When the start date changes, update the calendar month to match
    if (field === 'start' && value) {
      setCurrentMonth(new Date(value));
    }
  };

  // Calculate statistics based on filtered PICAs
  const calcFilteredStats = React.useMemo(() => {
    if (!picas) return { progress: 0, complete: 0, overdue: 0, total: 0 };
    
    // Filter by date range if both dates are set
    let filtered = picas;
    if (dateRange.start && dateRange.end) {
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      endDate.setHours(23, 59, 59, 999); // Include the entire end day
      
      filtered = filtered.filter((pica) => {
        const picaDate = new Date(pica.date);
        return picaDate >= startDate && picaDate <= endDate;
      });
    }
    
    const progress = filtered.filter(pica => pica.status === 'progress').length;
    const complete = filtered.filter(pica => pica.status === 'complete').length;
    const overdue = filtered.filter(pica => pica.status === 'overdue').length;
    
    return {
      progress,
      complete,
      overdue,
      total: filtered.length
    };
  }, [picas, dateRange]);
  
  // Calculate department statistics based on backend data
  const calcFilteredDeptStats = React.useMemo(() => {
    // Use the data directly from the backend, which is already calculated per department
    if (!deptStats || !Array.isArray(deptStats)) {
      return [];
    }
    
    // Backend now returns data in the correct format, we can use it directly
    return deptStats;
  }, [deptStats]);
  
  // Calculate site statistics based on filtered PICAs
  const calcFilteredSiteStats = React.useMemo(() => {
    if (!picas || !siteStats) return [];
    
    // Filter by date range
    let filtered = picas;
    if (dateRange.start && dateRange.end) {
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      endDate.setHours(23, 59, 59, 999); // Include the entire end day
      
      filtered = filtered.filter((pica) => {
        const picaDate = new Date(pica.date);
        return picaDate >= startDate && picaDate <= endDate;
      });
    }
    
    // Group by site
    const siteMap: Record<string, { site: string, progress: number, complete: number, overdue: number }> = {};
    
    // Initialize with existing sites
    if (Array.isArray(siteStats)) {
      siteStats.forEach(site => {
        siteMap[site.site] = { 
          site: site.site, 
          progress: 0, 
          complete: 0, 
          overdue: 0 
        };
      });
    }
    
    // Count PICAs by site and status
    filtered.forEach(pica => {
      const siteName = pica.projectSite?.code || 'Unknown';
      
      if (!siteMap[siteName]) {
        siteMap[siteName] = { site: siteName, progress: 0, complete: 0, overdue: 0 };
      }
      
      if (pica.status === 'progress') siteMap[siteName].progress++;
      if (pica.status === 'complete') siteMap[siteName].complete++;
      if (pica.status === 'overdue') siteMap[siteName].overdue++;
    });
    
    return Object.values(siteMap);
  }, [picas, siteStats, dateRange]);

  // Filter PICAs by status and date range
  const filteredPicas = React.useMemo(() => {
    if (!picas) return [];
    
    let filtered = picas;
    
    // Filter by date range if both dates are set
    if (dateRange.start && dateRange.end) {
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      endDate.setHours(23, 59, 59, 999); // Include the entire end day
      
      filtered = filtered.filter((pica) => {
        const picaDate = new Date(pica.date);
        return picaDate >= startDate && picaDate <= endDate;
      });
    }
    
    // Filter by status
    if (activeFilter !== "all") {
      filtered = filtered.filter((pica) => pica.status === activeFilter);
    }
    
    return filtered;
  }, [picas, activeFilter, dateRange]);
  
  // Calculate statistics from filtered data
  const filteredStats = React.useMemo(() => {
    const progress = filteredPicas.filter(pica => pica.status === "progress").length;
    const complete = filteredPicas.filter(pica => pica.status === "complete").length;
    const overdue = filteredPicas.filter(pica => pica.status === "overdue").length;
    const total = filteredPicas.length;
    
    return {
      progress,
      complete,
      overdue,
      total
    };
  }, [filteredPicas]);

  // For table pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // Show more items per page
  const totalPages = Math.ceil(filteredPicas.length / itemsPerPage);
  
  // Get current page items
  const getCurrentPageItems = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredPicas.slice(startIndex, endIndex);
  };

  return (
    <div className="p-0.5 max-w-[1200px] mx-auto">
      <div className="flex justify-between items-center mb-1">
        <h1 className="text-lg font-semibold text-gray-800">Dashboard PICA</h1>
        <div className="flex items-center gap-1 text-xs">
          <span className="font-medium">FILTER:</span>
          <div className="flex">
            <Input 
              type="date" 
              value={dateRange.start}
              onChange={(e) => handleDateChange('start', e.target.value)}
              className="h-6 w-24 text-xs px-1 py-0"
            />
            <span className="flex items-center px-1">-</span>
            <Input 
              type="date" 
              value={dateRange.end}
              onChange={(e) => handleDateChange('end', e.target.value)}
              className="h-6 w-24 text-xs px-1 py-0"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-1">
        {/* Status Cards Row */}
        <div className="col-span-12 grid grid-cols-4 gap-1">
          {/* In Progress Card */}
          <div className="bg-white border border-gray-100 rounded-md shadow-sm p-1.5">
            <div className="flex items-center">
              <h3 className="text-lg font-bold text-primary mr-1">
                {statsLoading || !filteredStats ? (
                  <Skeleton className="h-4 w-8" />
                ) : (
                  filteredStats.progress
                )}
              </h3>
              <p className="text-xs font-medium text-gray-500">In Progress</p>
              <div className="ml-auto p-1 bg-blue-100 rounded-full">
                <Clock className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Completed Card */}
          <div className="bg-white border border-gray-100 rounded-md shadow-sm p-1.5">
            <div className="flex items-center">
              <h3 className="text-lg font-bold text-green-600 mr-1">
                {statsLoading || !filteredStats ? (
                  <Skeleton className="h-4 w-8" />
                ) : (
                  filteredStats.complete
                )}
              </h3>
              <p className="text-xs font-medium text-gray-500">Completed</p>
              <div className="ml-auto p-1 bg-green-100 rounded-full">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </div>

          {/* Overdue Card */}
          <div className="bg-white border border-gray-100 rounded-md shadow-sm p-1.5">
            <div className="flex items-center">
              <h3 className="text-lg font-bold text-red-600 mr-1">
                {statsLoading || !filteredStats ? (
                  <Skeleton className="h-4 w-8" />
                ) : (
                  filteredStats.overdue
                )}
              </h3>
              <p className="text-xs font-medium text-gray-500">Overdue</p>
              <div className="ml-auto p-1 bg-red-100 rounded-full">
                <AlertCircle className="h-4 w-4 text-red-600" />
              </div>
            </div>
          </div>

          {/* Total PICA Card */}
          <div className="bg-white border border-gray-100 rounded-md shadow-sm p-1.5">
            <div className="flex items-center">
              <h3 className="text-lg font-bold text-gray-800 mr-1">
                {statsLoading || !filteredStats ? (
                  <Skeleton className="h-4 w-8" />
                ) : (
                  filteredStats.total
                )}
              </h3>
              <p className="text-xs font-medium text-gray-500">Total PICA</p>
              <div className="ml-auto p-1 bg-gray-100 rounded-full">
                <Calendar className="h-4 w-4 text-gray-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar and Project Site Chart Row */}
      <div className="grid grid-cols-12 gap-1 mt-1 mb-1">
        {/* Project Site Summary - Left Column */}
        <div className="col-span-3 bg-white border border-gray-100 rounded-md shadow-sm p-2">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-semibold">Project Site Summary</h3>
          </div>
          {siteStatsLoading ? (
            <Skeleton className="w-full h-[100px]" />
          ) : (
            <div className="overflow-hidden">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="text-xs font-medium text-gray-700 py-1 px-2 text-left">Site</th>
                    <th className="text-xs font-medium text-blue-600 py-1 px-2 text-center">Progress</th>
                    <th className="text-xs font-medium text-green-600 py-1 px-2 text-center">Complete</th>
                    <th className="text-xs font-medium text-red-600 py-1 px-2 text-center">Overdue</th>
                  </tr>
                </thead>
                <tbody>
                  {calcFilteredSiteStats.map((site, index) => (
                    <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="text-xs font-medium text-gray-800 py-1 px-2">{site.site}</td>
                      <td className="text-xs font-medium text-blue-600 py-1 px-2 text-center">
                        <span className="inline-block bg-blue-100 text-blue-700 rounded-full px-2 py-0.5">
                          {site.progress}
                        </span>
                      </td>
                      <td className="text-xs font-medium text-green-600 py-1 px-2 text-center">
                        <span className="inline-block bg-green-100 text-green-700 rounded-full px-2 py-0.5">
                          {site.complete}
                        </span>
                      </td>
                      <td className="text-xs font-medium text-red-600 py-1 px-2 text-center">
                        <span className="inline-block bg-red-100 text-red-700 rounded-full px-2 py-0.5">
                          {site.overdue}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Calendar - Right Column */}
        <div className="col-span-9 bg-white border border-gray-100 rounded-md shadow-sm p-2">
          {/* Calendar Header */}
          <div className="flex justify-between items-center mb-1">
            <div className="flex items-center gap-1">
              <h3 className="text-sm font-semibold">Calendar View</h3>
              {/* Legend Inline */}
              <div className="flex ml-2 items-center gap-1 text-xs">
                <div className="bg-yellow-300 text-black px-1 rounded">CREATE</div>
                <div className="bg-blue-500 text-white px-1 rounded">PROGRESS</div>
                <div className="bg-green-500 text-white px-1 rounded">COMPLETE</div>
                <div className="bg-red-500 text-white px-1 rounded">OVERDUE</div>
              </div>
            </div>
            <div className="flex items-center">
              <Button variant="outline" size="icon" className="h-6 w-6 p-0" onClick={prevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-xs font-medium mx-2">{format(currentMonth, "MMMM yyyy")}</h2>
              <Button variant="outline" size="icon" className="h-6 w-6 p-0" onClick={nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-0.5">
            {/* Days of week header */}
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
              <div key={day} className="text-center font-medium text-xs py-0.5">
                {day}
              </div>
            ))}

            {/* Empty cells for days before month start */}
            {Array.from({ length: startDay }).map((_, index) => (
              <div key={`empty-${index}`}></div>
            ))}

            {/* Actual calendar days */}
            {picasLoading ? (
              // Show skeleton while loading
              Array.from({ length: daysInMonth.length }).map((_, index) => (
                <div key={`skeleton-${index}`} className="border border-gray-200 min-h-[30px] p-1">
                  <Skeleton className="h-3 w-3 rounded-full" />
                  <Skeleton className="h-3 w-full mt-0.5" />
                </div>
              ))
            ) : (
              // Show actual calendar days
              daysInMonth.map((day) => {
                const dayPicas = getPicasForDay(day);
                return (
                  <div key={day.toISOString()} className="border border-gray-200 min-h-[40px] p-1">
                    <div className={`text-xs ${isToday(day) ? "bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center" : day.getDay() === 0 || day.getDay() === 6 ? "text-red-600 font-medium" : "font-medium"}`}>
                      {format(day, "d")}
                    </div>
                    {dayPicas.length > 0 && (
                      <div className="mt-0.5 overflow-hidden">
                        {dayPicas.slice(0, 2).map((pica: PicaWithRelations) => (
                          <HoverCard.Root key={`${pica.id}-${isPicaCreated(pica, day) ? 'created' : 'due'}`}>
                            <HoverCard.Trigger asChild>
                              <div 
                                className={`text-xs leading-tight truncate py-0 px-1 cursor-pointer rounded ${getPicaBackgroundColor(pica, day)}`}
                              >
                                {pica.picaId}
                              </div>
                            </HoverCard.Trigger>
                            <HoverCard.Content 
                              className="bg-white p-3 rounded-md shadow-lg border border-gray-200 w-64 z-50"
                              sideOffset={5}
                            >
                              <div className="flex flex-col gap-1">
                                <div className="flex justify-between items-center">
                                  <span className="font-bold text-sm">{pica.picaId}</span>
                                  <span className="flex items-center gap-0.5">
                                    {getStatusIcon(pica.status)}
                                    <span className="capitalize text-xs">{pica.status}</span>
                                  </span>
                                </div>
                                <div className="text-xs">
                                  <div><strong>Issue:</strong> {pica.issue}</div>
                                  <div><strong>Created:</strong> {formatDate(pica.date)}</div>
                                  <div><strong>Due:</strong> {formatDate(pica.dueDate)}</div>
                                  <div><strong>Project:</strong> {pica.projectSite?.name || 'Unknown'}</div>
                                  <div><strong>PIC:</strong> {pica.personInCharge?.name || 'Unknown'}</div>
                                </div>
                              </div>
                              <HoverCard.Arrow className="fill-white" />
                            </HoverCard.Content>
                          </HoverCard.Root>
                        ))}
                        {dayPicas.length > 2 && (
                          <div className="text-xs text-gray-500 truncate">+{dayPicas.length - 2} more</div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Person In Charge Monitor */}
      <div className="bg-white border border-gray-100 rounded-md shadow-sm">
        <div className="p-1.5 bg-gray-50 border-b flex flex-row justify-between items-center">
          <h2 className="text-sm font-semibold text-gray-800">
            Person In Charge Monitor
          </h2>
          <div className="flex gap-1">
            <Button 
              variant={activeFilter === "all" ? "default" : "outline"} 
              size="sm" 
              onClick={() => setActiveFilter("all")}
              className="text-xs h-6 px-2 py-0"
            >
              All
            </Button>
            <Button 
              variant={activeFilter === "progress" ? "default" : "outline"} 
              size="sm" 
              onClick={() => setActiveFilter("progress")}
              className="text-xs h-6 px-2 py-0"
            >
              Progress
            </Button>
            <Button 
              variant={activeFilter === "complete" ? "default" : "outline"} 
              size="sm" 
              onClick={() => setActiveFilter("complete")}
              className="text-xs h-6 px-2 py-0"
            >
              Complete
            </Button>
            <Button 
              variant={activeFilter === "overdue" ? "default" : "outline"} 
              size="sm" 
              onClick={() => setActiveFilter("overdue")}
              className="text-xs h-6 px-2 py-0"
            >
              Overdue
            </Button>
          </div>
        </div>
        <div className="p-1">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-primary">
                <tr>
                  <th
                    scope="col"
                    className="px-2 py-1 text-left text-xs font-medium text-white uppercase tracking-wider"
                  >
                    PICA ID
                  </th>
                  <th
                    scope="col"
                    className="px-2 py-1 text-left text-xs font-medium text-white uppercase tracking-wider"
                  >
                    Date
                  </th>
                  <th
                    scope="col"
                    className="px-2 py-1 text-left text-xs font-medium text-white uppercase tracking-wider"
                  >
                    Issue
                  </th>
                  <th
                    scope="col"
                    className="px-2 py-1 text-left text-xs font-medium text-white uppercase tracking-wider"
                  >
                    Task
                  </th>
                  <th
                    scope="col"
                    className="px-2 py-1 text-left text-xs font-medium text-white uppercase tracking-wider"
                  >
                    PIC
                  </th>
                  <th
                    scope="col"
                    className="px-2 py-1 text-left text-xs font-medium text-white uppercase tracking-wider"
                  >
                    Due Date
                  </th>
                  <th
                    scope="col"
                    className="px-2 py-1 text-center text-xs font-medium text-white uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-2 py-1 text-center text-xs font-medium text-white uppercase tracking-wider"
                  >
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {picasLoading ? (
                  Array(5)
                    .fill(0)
                    .map((_, i) => (
                      <tr key={i}>
                        <td className="px-2 py-1 whitespace-nowrap">
                          <Skeleton className="w-12 h-4" />
                        </td>
                        <td className="px-2 py-1 whitespace-nowrap">
                          <Skeleton className="w-14 h-4" />
                        </td>
                        <td className="px-2 py-1 whitespace-nowrap">
                          <Skeleton className="w-20 h-4" />
                        </td>
                        <td className="px-2 py-1 whitespace-nowrap">
                          <Skeleton className="w-24 h-4" />
                        </td>
                        <td className="px-2 py-1 whitespace-nowrap">
                          <Skeleton className="w-12 h-4" />
                        </td>
                        <td className="px-2 py-1 whitespace-nowrap">
                          <Skeleton className="w-14 h-4" />
                        </td>
                        <td className="px-2 py-1 whitespace-nowrap">
                          <Skeleton className="w-12 h-4" />
                        </td>
                        <td className="px-2 py-1 whitespace-nowrap">
                          <Skeleton className="w-10 h-4" />
                        </td>
                      </tr>
                    ))
                ) : filteredPicas.length > 0 ? (
                  // Show current page items
                  getCurrentPageItems().map((pica) => (
                    <tr key={pica.id} className="hover:bg-gray-50">
                      <td className="px-2 py-1 whitespace-nowrap text-xs font-medium text-gray-800">
                        {pica.picaId}
                      </td>
                      <td className="px-2 py-1 whitespace-nowrap text-xs text-gray-800">
                        {pica.date ? format(new Date(pica.date), 'dd/MM/yy') : '-'}
                      </td>
                      <td className="px-2 py-1 whitespace-nowrap text-xs text-gray-800">
                        {pica.issue && pica.issue.length > 25 
                          ? `${pica.issue.substring(0, 25)}...` 
                          : pica.issue}
                      </td>
                      <td className="px-2 py-1 whitespace-nowrap text-xs text-gray-800">
                        {pica.correctiveAction && pica.correctiveAction.length > 25
                          ? `${pica.correctiveAction.substring(0, 25)}...` 
                          : pica.correctiveAction}
                      </td>
                      <td className="px-2 py-1 whitespace-nowrap text-xs text-gray-800">
                        {pica.personInCharge?.name}
                      </td>
                      <td className="px-2 py-1 whitespace-nowrap text-xs text-gray-800">
                        {pica.dueDate ? format(new Date(pica.dueDate), 'dd/MM/yy') : '-'}
                      </td>
                      <td className="px-2 py-1 whitespace-nowrap text-center">
                        <StatusBadge status={pica.status} size="xs" />
                      </td>
                      <td className="px-2 py-1 whitespace-nowrap text-center">
                        <div className="flex justify-center space-x-1">
                          <Link href={`/pica-progress?picaId=${pica.picaId}`}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 p-0"
                              title="Edit PICA"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          </Link>
                          <Link href={`/pica-progress?picaId=${pica.picaId}&action=view`}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 p-0"
                              title="View Details"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                              </svg>
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-2 py-1 text-center text-xs text-gray-500"
                    >
                      No PICAs found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {/* Pagination controls */}
          {filteredPicas && filteredPicas.length > 0 && (
            <div className="flex items-center justify-between border-t border-gray-200 px-2 py-1 mt-1">
              <div className="hidden md:flex items-center text-xs text-gray-700">
                {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredPicas.length)} of {filteredPicas.length}
              </div>
              <div className="flex items-center space-x-1 mx-auto md:mx-0">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 text-xs px-2 py-0"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  Prev
                </Button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <Button
                    key={i}
                    variant={currentPage === i + 1 ? "default" : "outline"}
                    size="sm"
                    className="h-6 w-6 text-xs p-0"
                    onClick={() => setCurrentPage(i + 1)}
                  >
                    {i + 1}
                  </Button>
                )).slice(Math.max(0, currentPage - 2), Math.min(totalPages, currentPage + 1))}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 text-xs px-2 py-0"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;