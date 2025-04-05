import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { addMonths, subMonths, format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth, isToday, parseISO } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { PicaWithRelations } from "@shared/schema";

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
          <div className="bg-blue-100 p-3 flex items-center space-x-4">
            <div className="bg-yellow-300 text-xs font-medium px-2 py-1">PICA CREATED</div>
            <div className="bg-teal-700 text-white text-xs font-medium px-2 py-1">PICA DUE DATE</div>
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
                      <div 
                        key={`${pica.id}-${isPicaCreated(pica, day) ? 'created' : 'due'}`}
                        className={`mt-1 text-xs p-1 ${
                          isPicaCreated(pica, day) 
                            ? "bg-yellow-300" 
                            : "bg-teal-700 text-white"
                        }`}
                      >
                        {pica.picaId}
                      </div>
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
