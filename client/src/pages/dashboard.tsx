import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { addMonths, subMonths, format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth, isToday, parseISO } from "date-fns";
import PieChart from "@/components/charts/PieChart";
import BarChart from "@/components/charts/BarChart";
import PicaFilterButtons from "@/components/PicaFilterButtons";
import StatusBadge from "@/components/StatusBadge";
import { Card, CardContent } from "@/components/ui/card";
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
  
  // Initialize calendar month to match the start date of the filter
  const [currentMonth, setCurrentMonth] = useState(() => {
    return new Date(dateRange.start);
  });

  // Fetch PICA statistics
  const { data: stats, isLoading: statsLoading } = useQuery<{
    progress: number;
    complete: number;
    overdue: number;
    total: number;
  }>({
    queryKey: ["/api/picas/stats"],
  });

  // Fetch PICA by department statistics
  const { data: deptStats, isLoading: deptStatsLoading } = useQuery<Array<{
    department: string;
    progress: number;
    complete: number;
    overdue: number;
  }>>({
    queryKey: ["/api/picas/stats/department"],
  });

  // Fetch PICA by project site statistics
  const { data: siteStats, isLoading: siteStatsLoading } = useQuery<Array<{
    site: string;
    progress: number;
    complete: number;
    overdue: number;
  }>>({
    queryKey: ["/api/picas/stats/site"],
  });

  // Fetch PICAs
  const { data: picas, isLoading: picasLoading } = useQuery<PicaWithRelations[]>({
    queryKey: ["/api/picas"],
  });

  // Go to previous month for calendar
  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  // Go to next month for calendar
  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  // Get days in month for calendar
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
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
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'overdue':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'progress':
      default:
        return <Clock className="w-4 h-4 text-blue-500" />;
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
  
  // For table pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8; // Increased number of items per page
  const totalPages = Math.ceil(filteredPicas.length / itemsPerPage);
  
  // Get current page items
  const getCurrentPageItems = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredPicas.slice(startIndex, endIndex);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 gap-2">
        <h1 className="text-xl font-semibold text-gray-800">Dashboard PICA</h1>
        <div className="flex flex-col sm:flex-row items-center gap-1">
          <div className="text-xs text-gray-700 font-medium flex items-center">
            <Calendar className="mr-1 h-3 w-3" />
            <span>FILTER:</span>
          </div>
          <div className="flex space-x-1">
            <Input 
              type="date" 
              value={dateRange.start}
              onChange={(e) => handleDateChange('start', e.target.value)}
              className="h-7 w-32 text-xs"
            />
            <span className="flex items-center text-xs">-</span>
            <Input 
              type="date" 
              value={dateRange.end}
              onChange={(e) => handleDateChange('end', e.target.value)}
              className="h-7 w-32 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Compact Dashboard Layout */}
      {/* Top Row: Status Cards + PICA Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-2 mb-2">
        {/* Status Cards - First Column */}
        <div className="md:col-span-1">
          <div className="grid grid-rows-4 gap-1.5">
            {/* Progress Card */}
            <Card className="bg-white shadow-sm overflow-hidden">
              <CardContent className="p-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500">In Progress</p>
                    <h3 className="text-lg font-bold text-primary">
                      {statsLoading ? (
                        <Skeleton className="h-5 w-10" />
                      ) : (
                        (stats && stats.progress) || 0
                      )}
                    </h3>
                  </div>
                  <div className="p-1.5 bg-blue-100 rounded-full">
                    <Clock className="h-3.5 w-3.5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Completed Card */}
            <Card className="bg-white shadow-sm overflow-hidden">
              <CardContent className="p-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500">Completed</p>
                    <h3 className="text-lg font-bold text-green-600">
                      {statsLoading ? (
                        <Skeleton className="h-5 w-10" />
                      ) : (
                        (stats && stats.complete) || 0
                      )}
                    </h3>
                  </div>
                  <div className="p-1.5 bg-green-100 rounded-full">
                    <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Overdue Card */}
            <Card className="bg-white shadow-sm overflow-hidden">
              <CardContent className="p-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500">Overdue</p>
                    <h3 className="text-lg font-bold text-red-600">
                      {statsLoading ? (
                        <Skeleton className="h-5 w-10" />
                      ) : (
                        (stats && stats.overdue) || 0
                      )}
                    </h3>
                  </div>
                  <div className="p-1.5 bg-red-100 rounded-full">
                    <AlertCircle className="h-3.5 w-3.5 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Total PICA Card */}
            <Card className="bg-white shadow-sm overflow-hidden">
              <CardContent className="p-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500">Total PICA</p>
                    <h3 className="text-lg font-bold text-gray-800">
                      {statsLoading ? (
                        <Skeleton className="h-5 w-10" />
                      ) : (
                        (stats && stats.total) || 0
                      )}
                    </h3>
                  </div>
                  <div className="p-1.5 bg-gray-100 rounded-full">
                    <Calendar className="h-3.5 w-3.5 text-gray-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* PICA Overview - Second column */}
        <Card className="md:col-span-1">
          <CardContent className="p-2">
            <h3 className="text-xs font-semibold mb-1">PICA Overview</h3>
            <div className="flex flex-col">
              <div className="w-full flex items-center justify-center mb-1">
                {statsLoading ? (
                  <Skeleton className="w-[80px] h-[80px] rounded-full" />
                ) : (
                  <PieChart
                    data={[calcFilteredStats.progress, calcFilteredStats.complete, calcFilteredStats.overdue]}
                    labels={["Progress", "Complete", "Overdue"]}
                    colors={["#2563eb", "#22c55e", "#ef4444"]}
                  />
                )}
              </div>
              <div className="w-full">
                <div className="grid grid-cols-2 gap-0.5 mt-1 text-xs">
                  <div className="font-medium flex items-center"><div className="w-1.5 h-1.5 bg-primary rounded-sm mr-1"></div> Progress:</div>
                  <div className="font-semibold text-right text-blue-600">{calcFilteredStats.progress}</div>
                  
                  <div className="font-medium flex items-center"><div className="w-1.5 h-1.5 bg-green-500 rounded-sm mr-1"></div> Complete:</div>
                  <div className="font-semibold text-right text-green-600">{calcFilteredStats.complete}</div>
                  
                  <div className="font-medium flex items-center"><div className="w-1.5 h-1.5 bg-red-500 rounded-sm mr-1"></div> Overdue:</div>
                  <div className="font-semibold text-right text-red-600">{calcFilteredStats.overdue}</div>
                  
                  <div className="font-medium">Total:</div>
                  <div className="font-semibold text-right">{calcFilteredStats.total}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Department PICA Chart - Third and Fourth columns */}
        <Card className="md:col-span-3">
          <CardContent className="p-2">
            <div className="flex justify-between items-center mb-1">
              <h3 className="text-xs font-semibold">Department PICA Summary</h3>
              <div className="flex flex-wrap items-center text-[9px] gap-1">
                <div className="flex items-center mr-1">
                  <div className="w-1.5 h-1.5 bg-primary rounded-sm mr-0.5"></div>
                  <span>Progress</span>
                </div>
                <div className="flex items-center mr-1">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-sm mr-0.5"></div>
                  <span>Complete</span>
                </div>
                <div className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-sm mr-0.5"></div>
                  <span>Overdue</span>
                </div>
              </div>
            </div>
            {deptStatsLoading ? (
              <Skeleton className="w-full h-[140px]" />
            ) : (
              <div className="h-[140px]">
                <BarChart
                  labels={calcFilteredDeptStats.map(d => d.department)}
                  datasets={[
                    {
                      label: "Progress",
                      data: calcFilteredDeptStats.map(d => d.progress),
                      backgroundColor: "#2563eb",
                    },
                    {
                      label: "Complete",
                      data: calcFilteredDeptStats.map(d => d.complete),
                      backgroundColor: "#22c55e", // Green for Complete
                    },
                    {
                      label: "Overdue",
                      data: calcFilteredDeptStats.map(d => d.overdue),
                      backgroundColor: "#ef4444", // Red for Overdue
                    },
                  ]}
                  maxY={5}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Middle Row: Project Site Chart and Calendar */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-2 mb-2">
        {/* Project Site PICA Chart - First two columns */}
        <Card className="md:col-span-2">
          <CardContent className="p-2">
            <div className="flex justify-between items-center mb-1">
              <h3 className="text-xs font-semibold">Project Site Summary</h3>
              <div className="flex flex-wrap items-center text-[9px] gap-1">
                <div className="flex items-center mr-1">
                  <div className="w-1.5 h-1.5 bg-primary rounded-sm mr-0.5"></div>
                  <span>Progress</span>
                </div>
                <div className="flex items-center mr-1">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-sm mr-0.5"></div>
                  <span>Complete</span>
                </div>
                <div className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-sm mr-0.5"></div>
                  <span>Overdue</span>
                </div>
              </div>
            </div>
            {siteStatsLoading ? (
              <Skeleton className="w-full h-[140px]" />
            ) : (
              <div className="h-[140px]">
                <BarChart
                  labels={calcFilteredSiteStats.map(s => s.site)}
                  datasets={[
                    {
                      label: "Progress",
                      data: calcFilteredSiteStats.map(s => s.progress),
                      backgroundColor: "#2563eb",
                    },
                    {
                      label: "Complete",
                      data: calcFilteredSiteStats.map(s => s.complete),
                      backgroundColor: "#22c55e", // Green for Complete
                    },
                    {
                      label: "Overdue",
                      data: calcFilteredSiteStats.map(s => s.overdue),
                      backgroundColor: "#ef4444", // Red for Overdue
                    },
                  ]}
                  maxY={6}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Calendar - Last three columns */}
        <Card className="md:col-span-3">
          <CardContent className="p-2">
            {/* Calendar Header */}
            <div className="flex justify-between items-center mb-1">
              <h3 className="text-xs font-semibold">Calendar View</h3>
              <div className="flex items-center">
                <Button variant="outline" size="icon" className="h-6 w-6" onClick={prevMonth}>
                  <ChevronLeft className="h-3 w-3" />
                </Button>
                <h2 className="text-xs font-medium mx-2">{format(currentMonth, "MMMM yyyy")}</h2>
                <Button variant="outline" size="icon" className="h-6 w-6" onClick={nextMonth}>
                  <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-1 text-[9px] mb-1">
              <div className="bg-yellow-300 font-medium px-1 py-0.5 rounded text-[8px]">CREATED</div>
              <div className="bg-blue-500 text-white font-medium px-1 py-0.5 rounded flex items-center gap-0.5 text-[8px]">
                <Clock className="w-1.5 h-1.5" /> PROGRESS
              </div>
              <div className="bg-green-500 text-white font-medium px-1 py-0.5 rounded flex items-center gap-0.5 text-[8px]">
                <CheckCircle className="w-1.5 h-1.5" /> COMPLETE
              </div>
              <div className="bg-red-500 text-white font-medium px-1 py-0.5 rounded flex items-center gap-0.5 text-[8px]">
                <AlertCircle className="w-1.5 h-1.5" /> OVERDUE
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-0.5">
              {/* Days of week header */}
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                <div key={day} className="text-center font-medium text-[9px] py-0.5">
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
                  <div key={`skeleton-${index}`} className="border border-gray-200 min-h-[45px] p-0.5">
                    <Skeleton className="h-3 w-3 rounded-full" />
                    <Skeleton className="h-3 w-full mt-0.5" />
                  </div>
                ))
              ) : (
                // Show actual calendar days
                daysInMonth.map((day) => {
                  const dayPicas = getPicasForDay(day);
                  return (
                    <div key={day.toISOString()} className="border border-gray-200 min-h-[45px] p-0.5">
                      <div className={`text-[9px] ${isToday(day) ? "bg-primary text-white rounded-full w-3.5 h-3.5 flex items-center justify-center" : day.getDay() === 0 || day.getDay() === 6 ? "text-red-600 font-medium" : "font-medium"}`}>
                        {format(day, "d")}
                      </div>
                      {dayPicas.length > 0 && (
                        <div className="mt-0.5 overflow-hidden">
                          {dayPicas.slice(0, 2).map((pica: PicaWithRelations) => (
                            <HoverCard.Root key={`${pica.id}-${isPicaCreated(pica, day) ? 'created' : 'due'}`}>
                              <HoverCard.Trigger asChild>
                                <div 
                                  className={`mt-0.5 text-[0.6rem] leading-tight truncate p-0.5 cursor-pointer rounded ${getPicaBackgroundColor(pica, day)}`}
                                >
                                  {pica.picaId}
                                </div>
                              </HoverCard.Trigger>
                              <HoverCard.Content 
                                className="bg-white p-2 rounded-md shadow-lg border border-gray-200 w-60 z-50"
                                sideOffset={5}
                              >
                                <div className="flex flex-col gap-1">
                                  <div className="flex justify-between items-center">
                                    <span className="font-bold text-xs">{pica.picaId}</span>
                                    <span className="flex items-center gap-1">
                                      {getStatusIcon(pica.status)}
                                      <span className="capitalize text-[10px]">{pica.status}</span>
                                    </span>
                                  </div>
                                  <div className="text-[10px]">
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
                            <div className="text-[0.55rem] text-gray-500 truncate">+{dayPicas.length - 2} more</div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Person In Charge Monitor */}
      <Card>
        <CardContent className="p-0">
          <div className="p-1.5 bg-gray-50 border-b flex flex-col sm:flex-row sm:justify-between sm:items-center">
            <h2 className="text-xs font-semibold text-gray-800 mb-1 sm:mb-0">
              Person In Charge Monitor
            </h2>
            <div className="flex flex-wrap gap-1">
              <Button 
                variant={activeFilter === "all" ? "default" : "outline"} 
                size="sm" 
                onClick={() => setActiveFilter("all")}
                className="text-[10px] h-6 px-1.5"
              >
                All
              </Button>
              <Button 
                variant={activeFilter === "progress" ? "default" : "outline"} 
                size="sm" 
                onClick={() => setActiveFilter("progress")}
                className="text-[10px] h-6 px-1.5"
              >
                Progress
              </Button>
              <Button 
                variant={activeFilter === "complete" ? "default" : "outline"} 
                size="sm" 
                onClick={() => setActiveFilter("complete")}
                className="text-[10px] h-6 px-1.5"
              >
                Complete
              </Button>
              <Button 
                variant={activeFilter === "overdue" ? "default" : "outline"} 
                size="sm" 
                onClick={() => setActiveFilter("overdue")}
                className="text-[10px] h-6 px-1.5"
              >
                Overdue
              </Button>
            </div>
          </div>
          <div className="p-1.5">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-primary">
                  <tr>
                    <th
                      scope="col"
                      className="px-1 py-1 text-left text-[9px] font-medium text-white uppercase tracking-wider"
                    >
                      PICA ID
                    </th>
                    <th
                      scope="col"
                      className="px-1 py-1 text-left text-[9px] font-medium text-white uppercase tracking-wider"
                    >
                      Date
                    </th>
                    <th
                      scope="col"
                      className="px-1 py-1 text-left text-[9px] font-medium text-white uppercase tracking-wider"
                    >
                      Issue
                    </th>
                    <th
                      scope="col"
                      className="px-1 py-1 text-left text-[9px] font-medium text-white uppercase tracking-wider"
                    >
                      Task
                    </th>
                    <th
                      scope="col"
                      className="px-1 py-1 text-left text-[9px] font-medium text-white uppercase tracking-wider"
                    >
                      PIC
                    </th>
                    <th
                      scope="col"
                      className="px-1 py-1 text-left text-[9px] font-medium text-white uppercase tracking-wider"
                    >
                      Due Date
                    </th>
                    <th
                      scope="col"
                      className="px-1 py-1 text-center text-[9px] font-medium text-white uppercase tracking-wider"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-1 py-1 text-center text-[9px] font-medium text-white uppercase tracking-wider"
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
                          <td className="px-1 py-0.5 whitespace-nowrap">
                            <Skeleton className="w-12 h-2.5" />
                          </td>
                          <td className="px-1 py-0.5 whitespace-nowrap">
                            <Skeleton className="w-14 h-2.5" />
                          </td>
                          <td className="px-1 py-0.5 whitespace-nowrap">
                            <Skeleton className="w-20 h-2.5" />
                          </td>
                          <td className="px-1 py-0.5 whitespace-nowrap">
                            <Skeleton className="w-24 h-2.5" />
                          </td>
                          <td className="px-1 py-0.5 whitespace-nowrap">
                            <Skeleton className="w-12 h-2.5" />
                          </td>
                          <td className="px-1 py-0.5 whitespace-nowrap">
                            <Skeleton className="w-14 h-2.5" />
                          </td>
                          <td className="px-1 py-0.5 whitespace-nowrap">
                            <Skeleton className="w-14 h-2.5" />
                          </td>
                          <td className="px-1 py-0.5 whitespace-nowrap">
                            <Skeleton className="w-8 h-2.5" />
                          </td>
                        </tr>
                      ))
                  ) : filteredPicas.length > 0 ? (
                    // Show current page items
                    getCurrentPageItems().map((pica) => (
                      <tr key={pica.id} className="hover:bg-gray-50">
                        <td className="px-1 py-1 whitespace-nowrap text-[10px] font-medium text-gray-800">
                          {pica.picaId}
                        </td>
                        <td className="px-1 py-1 whitespace-nowrap text-[10px] text-gray-800">
                          {pica.date ? format(new Date(pica.date), 'dd MMM yy') : '-'}
                        </td>
                        <td className="px-1 py-1 whitespace-nowrap text-[10px] text-gray-800">
                          {pica.issue.length > 20 
                            ? `${pica.issue.substring(0, 20)}...` 
                            : pica.issue}
                        </td>
                        <td className="px-1 py-1 whitespace-nowrap text-[10px] text-gray-800">
                          {pica.correctiveAction.length > 25 
                            ? `${pica.correctiveAction.substring(0, 25)}...` 
                            : pica.correctiveAction}
                        </td>
                        <td className="px-1 py-1 whitespace-nowrap text-[10px] text-gray-800">
                          {pica.personInCharge?.name}
                        </td>
                        <td className="px-1 py-1 whitespace-nowrap text-[10px] text-gray-800">
                          {pica.dueDate ? format(new Date(pica.dueDate), 'dd MMM yy') : '-'}
                        </td>
                        <td className="px-1 py-1 whitespace-nowrap text-center">
                          <StatusBadge status={pica.status} size="xs" />
                        </td>
                        <td className="px-1 py-1 whitespace-nowrap text-center">
                          <div className="flex justify-center space-x-0.5">
                            <Link href={`/pica-progress?picaId=${pica.picaId}`}>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5"
                                title="Edit PICA"
                              >
                                <Edit className="h-2.5 w-2.5" />
                              </Button>
                            </Link>
                            <Link href={`/pica-progress?picaId=${pica.picaId}&action=view`}>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5"
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
                        className="px-1 py-1 text-center text-[10px] text-gray-500"
                      >
                        No PICAs found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {/* Pagination controls */}
            {filteredPicas.length > 0 && (
              <div className="flex items-center justify-between border-t border-gray-200 px-1 py-1 mt-1">
                <div className="hidden md:flex items-center text-[10px] text-gray-700">
                  {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredPicas.length)} of {filteredPicas.length}
                </div>
                <div className="flex items-center space-x-0.5 mx-auto md:mx-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-5 text-[10px] px-1"
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
                      className="h-5 w-5 text-[10px]"
                      onClick={() => setCurrentPage(i + 1)}
                    >
                      {i + 1}
                    </Button>
                  )).slice(Math.max(0, currentPage - 2), Math.min(totalPages, currentPage + 1))}
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-5 text-[10px] px-1"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
