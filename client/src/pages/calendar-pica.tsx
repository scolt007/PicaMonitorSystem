import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { addMonths, subMonths, format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth, isToday, parseISO } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import * as HoverCard from '@radix-ui/react-hover-card';
import { PicaWithRelations } from "@shared/schema";
import { formatDate } from "@/lib/utils";

const CalendarPica: React.FC = () => {
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
  
  // Fetch PICAs
  const { data: picas, isLoading } = useQuery<PicaWithRelations[]>({
    queryKey: ["/api/picas"],
  });

  // Go to previous month
  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  // Go to next month
  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  // Get days in month
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Get day of week for the first day (0 = Sunday, 1 = Monday, etc.)
  const startDay = getDay(monthStart);
  
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
  
  // Filter PICAs by date range
  const filteredPicas = React.useMemo(() => {
    if (!picas) return [];
    
    // If both dates are set, filter by date range
    if (dateRange.start && dateRange.end) {
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      endDate.setHours(23, 59, 59, 999); // Include the entire end day
      
      return picas.filter((pica) => {
        const picaDate = new Date(pica.date);
        return picaDate >= startDate && picaDate <= endDate;
      });
    }
    
    return picas;
  }, [picas, dateRange]);
  
  // Filter PICAs for current month from the filtered list
  const picasInMonth = React.useMemo(() => {
    if (!filteredPicas) return [];
    
    return filteredPicas.filter((pica) => {
      const picaDate = parseISO(pica.date);
      const picaDueDate = parseISO(pica.dueDate);
      return isSameMonth(picaDate, currentMonth) || isSameMonth(picaDueDate, currentMonth);
    });
  }, [filteredPicas, currentMonth]);

  // Get PICAs for a specific day
  const getPicasForDay = (day: Date) => {
    if (!picasInMonth) return [];
    
    return picasInMonth.filter((pica) => {
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

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
        <h1 className="text-2xl font-semibold text-gray-800">CALENDAR PICA</h1>
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

      <Card className="overflow-hidden">
        <CardContent className="p-4">
          {/* Calendar Header */}
          <div className="bg-red-600 text-white p-3 flex justify-between items-center">
            <Button variant="ghost" size="icon" className="text-white hover:bg-red-700" onClick={prevMonth}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h2 className="text-xl font-medium">{format(currentMonth, "MMMM yyyy")}</h2>
            <Button variant="ghost" size="icon" className="text-white hover:bg-red-700" onClick={nextMonth}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          {/* Legend */}
          <div className="bg-blue-100 p-3 flex flex-wrap items-center gap-2">
            <div className="bg-yellow-300 text-xs font-medium px-2 py-1 rounded">PICA CREATED</div>
            <div className="bg-blue-500 text-white text-xs font-medium px-2 py-1 rounded flex items-center gap-1">
              <Clock className="w-3 h-3" /> PROGRESS
            </div>
            <div className="bg-green-500 text-white text-xs font-medium px-2 py-1 rounded flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> COMPLETE
            </div>
            <div className="bg-red-500 text-white text-xs font-medium px-2 py-1 rounded flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> OVERDUE
            </div>
            <div className="text-xs font-medium ml-auto">Hover over any PICA to see details</div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 mt-2">
            {/* Days of week header */}
            {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day) => (
              <div key={day} className="text-center font-medium text-sm py-2">
                {day}
              </div>
            ))}

            {/* Empty cells for days before month start */}
            {Array.from({ length: startDay }).map((_, index) => (
              <div key={`empty-${index}`}></div>
            ))}

            {/* Actual calendar days */}
            {isLoading ? (
              // Show skeleton while loading
              Array.from({ length: daysInMonth.length }).map((_, index) => (
                <div key={`skeleton-${index}`} className="border border-gray-200 min-h-[80px] p-1">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <Skeleton className="h-6 w-full mt-2" />
                </div>
              ))
            ) : (
              // Show actual calendar days
              daysInMonth.map((day) => {
                const dayPicas = getPicasForDay(day);
                return (
                  <div key={day.toISOString()} className="border border-gray-200 min-h-[80px] p-1">
                    <div className={`text-sm ${isToday(day) ? "bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center" : day.getDay() === 0 || day.getDay() === 6 ? "text-red-600 font-medium" : "font-medium"}`}>
                      {format(day, "d")}
                    </div>
                    {dayPicas.map((pica) => (
                      <HoverCard.Root key={`${pica.id}-${isPicaCreated(pica, day) ? 'created' : 'due'}`}>
                        <HoverCard.Trigger asChild>
                          <div 
                            className={`mt-1 text-xs p-1 cursor-pointer rounded ${getPicaBackgroundColor(pica, day)}`}
                          >
                            {pica.picaId}
                          </div>
                        </HoverCard.Trigger>
                        <HoverCard.Content 
                          className="bg-white p-3 rounded-md shadow-lg border border-gray-200 w-64 z-50"
                          sideOffset={5}
                        >
                          <div className="flex flex-col gap-2">
                            <div className="flex justify-between items-center">
                              <span className="font-bold">{pica.picaId}</span>
                              <span className="flex items-center gap-1">
                                {getStatusIcon(pica.status)}
                                <span className="capitalize text-xs">{pica.status}</span>
                              </span>
                            </div>
                            <div className="text-xs">
                              <div><strong>Issue:</strong> {pica.issue}</div>
                              <div><strong>Problem:</strong> {pica.problemIdentification}</div>
                              <div><strong>Action:</strong> {pica.correctiveAction}</div>
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
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CalendarPica;
