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
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";

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
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/picas/stats"],
  });

  // Fetch PICA by department statistics
  const { data: deptStats, isLoading: deptStatsLoading } = useQuery({
    queryKey: ["/api/picas/stats/department"],
  });

  // Fetch PICA by project site statistics
  const { data: siteStats, isLoading: siteStatsLoading } = useQuery({
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
  const picasInMonth = picas?.filter((pica: any) => {
    const picaDate = parseISO(pica.date);
    const picaDueDate = parseISO(pica.dueDate);
    return isSameMonth(picaDate, currentMonth) || isSameMonth(picaDueDate, currentMonth);
  });

  // Get PICAs for a specific day
  const getPicasForDay = (day: Date) => {
    if (!picasInMonth) return [];
    
    return picasInMonth.filter((pica: any) => {
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
  const isPicaCreated = (pica: any, day: Date) => {
    const picaDate = parseISO(pica.date);
    return picaDate.getDate() === day.getDate() && 
           picaDate.getMonth() === day.getMonth() && 
           picaDate.getFullYear() === day.getFullYear();
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
  
  // Calculate department statistics based on date-filtered PICAs
  const calcFilteredDeptStats = React.useMemo(() => {
    if (!picas || !deptStats) return [];
    
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
    
    // Group by department
    const deptMap: Record<string, { department: string, progress: number, complete: number, overdue: number }> = {};
    
    // Initialize with existing departments
    if (Array.isArray(deptStats)) {
      deptStats.forEach((dept: any) => {
        deptMap[dept.department] = { 
          department: dept.department, 
          progress: 0, 
          complete: 0, 
          overdue: 0 
        };
      });
    }
    
    // Count PICAs by department and status
    filtered.forEach(pica => {
      // Need to handle the relationship properly by looking up department info from the personInCharge
      let deptName = 'Unknown';
      
      if (pica.personInCharge) {
        // First, get the department ID from the person
        const deptId = pica.personInCharge.departmentId;
        
        // Find the department from the relevant array if available
        if (deptId && Array.isArray(deptStats)) {
          const dept = deptStats.find((d: any) => d.id === deptId);
          if (dept && dept.name) {
            deptName = dept.name;
          }
        }
      }
      
      if (!deptMap[deptName]) {
        deptMap[deptName] = { department: deptName, progress: 0, complete: 0, overdue: 0 };
      }
      
      if (pica.status === 'progress') deptMap[deptName].progress++;
      if (pica.status === 'complete') deptMap[deptName].complete++;
      if (pica.status === 'overdue') deptMap[deptName].overdue++;
    });
    
    return Object.values(deptMap);
  }, [picas, deptStats, dateRange]);
  
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
      siteStats.forEach((site: any) => {
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

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
        <h1 className="text-2xl font-semibold text-gray-800">Dashboard PICA</h1>
        <div className="flex flex-col sm:flex-row items-center gap-2">
          <div className="text-sm text-gray-700 font-medium flex items-center">
            <Calendar className="mr-2 h-4 w-4" />
            <span>FILTER DATE:</span>
          </div>
          <div className="flex space-x-2">
            <Input 
              type="date" 
              value={dateRange.start}
              onChange={(e) => handleDateChange('start', e.target.value)}
              className="h-9 w-36"
            />
            <span className="flex items-center">to</span>
            <Input 
              type="date" 
              value={dateRange.end}
              onChange={(e) => handleDateChange('end', e.target.value)}
              className="h-9 w-36"
            />
          </div>
        </div>
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* PICA Overview */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row">
              <div className="w-full md:w-1/2 flex items-center justify-center mb-4 md:mb-0">
                {statsLoading ? (
                  <Skeleton className="w-[200px] h-[200px] rounded-full" />
                ) : (
                  <PieChart
                    data={[calcFilteredStats.progress, calcFilteredStats.complete, calcFilteredStats.overdue]}
                    labels={["Progress", "Complete", "Overdue"]}
                    colors={["#2563eb", "#f97316", "#9ca3af"]}
                  />
                )}
              </div>
              <div className="w-full md:w-1/2 flex flex-col justify-center pl-0 md:pl-4">
                <div className="mb-2 text-lg font-medium">
                  Created : <span className="font-semibold">{calcFilteredStats.total}</span>
                </div>
                <div className="mb-2 text-lg font-medium">
                  Complete : <span className="font-semibold">{calcFilteredStats.complete}</span>
                </div>
                <div className="mb-2 text-lg font-medium">
                  Progress : <span className="font-semibold">{calcFilteredStats.progress}</span>
                </div>
                <div className="text-lg font-medium">
                  Overdue : <span className="font-semibold">{calcFilteredStats.overdue}</span>
                </div>
                <div className="mt-4 flex text-xs font-medium">
                  <div className="flex items-center mr-3">
                    <div className="w-3 h-3 bg-primary rounded-sm mr-1"></div>
                    <span>PROGRESS</span>
                  </div>
                  <div className="flex items-center mr-3">
                    <div className="w-3 h-3 bg-orange-500 rounded-sm mr-1"></div>
                    <span>COMPLETE</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-gray-400 rounded-sm mr-1"></div>
                    <span>OVERDUE</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Department PICA Chart */}
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center text-sm">
                <div className="w-4 h-4 bg-primary mr-1"></div>
                <span className="mr-3">Progress</span>
                <div className="w-4 h-4 bg-orange-500 mr-1"></div>
                <span className="mr-3">Complete</span>
                <div className="w-4 h-4 bg-gray-400 mr-1"></div>
                <span>Overdue</span>
              </div>
            </div>
            {deptStatsLoading ? (
              <Skeleton className="w-full h-[200px]" />
            ) : (
              <BarChart
                labels={calcFilteredDeptStats.map((d: any) => d.department)}
                datasets={[
                  {
                    label: "Progress",
                    data: calcFilteredDeptStats.map((d: any) => d.progress),
                    backgroundColor: "#2563eb",
                  },
                  {
                    label: "Complete",
                    data: calcFilteredDeptStats.map((d: any) => d.complete),
                    backgroundColor: "#f97316",
                  },
                  {
                    label: "Overdue",
                    data: calcFilteredDeptStats.map((d: any) => d.overdue),
                    backgroundColor: "#9ca3af",
                  },
                ]}
                maxY={5}
              />
            )}
          </CardContent>
        </Card>

        {/* Project Site PICA Chart */}
        <Card>
          <CardContent className="p-4">
            {siteStatsLoading ? (
              <Skeleton className="w-full h-[200px]" />
            ) : (
              <BarChart
                labels={calcFilteredSiteStats.map((s: any) => s.site)}
                datasets={[
                  {
                    label: "Progress",
                    data: calcFilteredSiteStats.map((s: any) => s.progress),
                    backgroundColor: "#2563eb",
                  },
                  {
                    label: "Complete",
                    data: calcFilteredSiteStats.map((s: any) => s.complete),
                    backgroundColor: "#f97316",
                  },
                  {
                    label: "Overdue",
                    data: calcFilteredSiteStats.map((s: any) => s.overdue),
                    backgroundColor: "#9ca3af",
                  },
                ]}
                maxY={6}
              />
            )}
          </CardContent>
        </Card>

        {/* Calendar PICA */}
        <Card>
          <CardContent className="p-4">
            {/* Calendar Header */}
            <div className="bg-primary text-white p-2 flex justify-between items-center rounded-md mb-2">
              <Button variant="ghost" size="icon" className="text-white hover:bg-primary/80" onClick={prevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-base font-medium">{format(currentMonth, "MMMM yyyy")}</h2>
              <Button variant="ghost" size="icon" className="text-white hover:bg-primary/80" onClick={nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-2 text-xs mb-2">
              <div className="bg-yellow-300 text-xs font-medium px-2 py-0.5 rounded">PICA CREATED</div>
              <div className="bg-teal-700 text-white text-xs font-medium px-2 py-0.5 rounded">PICA DUE DATE</div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Days of week header */}
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                <div key={day} className="text-center font-medium text-xs py-1">
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
                  <div key={`skeleton-${index}`} className="border border-gray-200 min-h-[55px] p-1">
                    <Skeleton className="h-4 w-4 rounded-full" />
                    <Skeleton className="h-4 w-full mt-1" />
                  </div>
                ))
              ) : (
                // Show actual calendar days
                daysInMonth.map((day) => {
                  const dayPicas = getPicasForDay(day);
                  return (
                    <div key={day.toISOString()} className="border border-gray-200 min-h-[55px] p-1">
                      <div className={`text-xs ${isToday(day) ? "bg-primary text-white rounded-full w-4 h-4 flex items-center justify-center" : day.getDay() === 0 || day.getDay() === 6 ? "text-red-600 font-medium" : "font-medium"}`}>
                        {format(day, "d")}
                      </div>
                      {dayPicas.length > 0 && (
                        <div className="mt-1 overflow-hidden">
                          {dayPicas.slice(0, 2).map((pica: any) => (
                            <div 
                              key={`${pica.id}-${isPicaCreated(pica, day) ? 'created' : 'due'}`}
                              className={`mt-0.5 text-[0.65rem] leading-tight truncate p-0.5 ${
                                isPicaCreated(pica, day) 
                                  ? "bg-yellow-300" 
                                  : "bg-teal-700 text-white"
                              }`}
                            >
                              {pica.picaId}
                            </div>
                          ))}
                          {dayPicas.length > 2 && (
                            <div className="text-[0.6rem] text-gray-500 truncate">+{dayPicas.length - 2} more</div>
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
      <Card className="mt-6">
        <CardContent className="p-0">
          <div className="p-3 bg-gray-50 border-b flex justify-between items-center">
            <h2 className="text-base font-medium text-gray-800">
              Person In Charge Monitor
            </h2>
            <PicaFilterButtons
              activeFilter={activeFilter}
              onFilterChange={(filter) => setActiveFilter(filter)}
            />
          </div>
          <div className="p-3">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-primary">
                  <tr>
                    <th
                      scope="col"
                      className="px-3 py-2 text-left text-xs font-medium text-white uppercase tracking-wider"
                    >
                      Task Progress
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-2 text-left text-xs font-medium text-white uppercase tracking-wider"
                    >
                      PIC
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-2 text-left text-xs font-medium text-white uppercase tracking-wider"
                    >
                      Created
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-2 text-left text-xs font-medium text-white uppercase tracking-wider"
                    >
                      Due Date
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-2 text-left text-xs font-medium text-white uppercase tracking-wider"
                    >
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {picasLoading ? (
                    Array(3)
                      .fill(0)
                      .map((_, i) => (
                        <tr key={i}>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <Skeleton className="w-full h-4" />
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <Skeleton className="w-16 h-4" />
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <Skeleton className="w-20 h-4" />
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <Skeleton className="w-20 h-4" />
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <Skeleton className="w-20 h-4" />
                          </td>
                        </tr>
                      ))
                  ) : filteredPicas.length > 0 ? (
                    // Only show first 5 items to keep it compact
                    filteredPicas.slice(0, 5).map((pica) => (
                      <tr key={pica.id}>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-800">
                          {pica.correctiveAction.length > 50 
                            ? `${pica.correctiveAction.substring(0, 50)}...` 
                            : pica.correctiveAction}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-800">
                          {pica.personInCharge?.name}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-800">
                          {pica.date ? format(new Date(pica.date), 'dd MMM yyyy') : '-'}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-800">
                          {pica.dueDate ? format(new Date(pica.dueDate), 'dd MMM yyyy') : '-'}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs">
                          <StatusBadge status={pica.status} />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-3 py-2 text-center text-xs text-gray-500"
                      >
                        No PICAs found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {filteredPicas.length > 5 && (
              <div className="text-center text-xs text-gray-500 mt-2">
                Showing 5 of {filteredPicas.length} items
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
