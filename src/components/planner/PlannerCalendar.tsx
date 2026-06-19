import React, { useState } from 'react';
import { 
    format, 
    startOfMonth, 
    endOfMonth, 
    startOfWeek, 
    endOfWeek, 
    addDays, 
    subDays,
    isSameMonth, 
    isSameDay, 
    addMonths, 
    subMonths,
    isToday
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { PlanItem } from '../../hooks/usePlannerData';

interface PlannerCalendarProps {
    planItems: PlanItem[];
    onDateSelect: (date: Date) => void;
}

export function PlannerCalendar({ planItems, onDateSelect }: PlannerCalendarProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
    const today = () => setCurrentMonth(new Date());

    const startDate = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
    const endDate = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
    const dateFormat = "d";
    
    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = "";

    while (day <= endDate) {
        for (let i = 0; i < 7; i++) {
            formattedDate = format(day, dateFormat);
            const cloneDay = day;
            const dateStr = format(cloneDay, 'yyyy-MM-dd');
            
            const dayItems = planItems.filter(item => item.dateStr === dateStr);
            const hasItems = dayItems.length > 0;
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isTodayDate = isToday(day);

            // Create a small dot indicator (neutral dot if simple, or max 3 color dots)
            const uniqueSubjects = Array.from(new Set(dayItems.map(item => item.subject)));

            days.push(
                <div
                    key={day.toString()}
                    className={cn(
                        "min-h-[80px] p-2 flex flex-col border border-border-subtle hover:bg-bg-base/30 cursor-pointer transition-colors relative",
                        !isCurrentMonth ? "text-gray-600 bg-bg-base/10" : "bg-bg-card",
                        isTodayDate ? "ring-1 ring-inset ring-brand bg-brand/5" : ""
                    )}
                    onClick={() => onDateSelect(cloneDay)}
                >
                    <div className="flex justify-between items-start">
                        <span className={cn(
                            "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full",
                            isTodayDate ? "bg-brand text-white" : isCurrentMonth ? "text-gray-300" : "text-gray-600"
                        )}>
                            {formattedDate}
                        </span>
                    </div>

                    <div className="mt-auto pt-2 flex gap-1 flex-wrap">
                        {uniqueSubjects.slice(0, 3).map(sub => (
                            <span 
                                key={sub} 
                                className="w-2 h-2 rounded-full" 
                                style={{ backgroundColor: `var(--color-subject-${sub})` }} 
                            />
                        ))}
                        {uniqueSubjects.length > 3 && (
                            <span className="w-2 h-2 rounded-full bg-gray-500" />
                        )}
                    </div>
                    {hasItems && dayItems.length > 0 && (
                        <div className="mt-1 text-[10px] text-gray-500 font-medium">
                            {dayItems.length} item{dayItems.length > 1 ? 's' : ''}
                        </div>
                    )}
                </div>
            );
            day = addDays(day, 1);
        }
        rows.push(
            <div className="grid grid-cols-7" key={day.toString()}>
                {days}
            </div>
        );
        days = [];
    }

    return (
        <div className="bg-bg-card border border-border-subtle rounded-xl overflow-hidden shadow-sm">
            <div className="flex justify-between items-center p-4 border-b border-border-subtle">
                <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-gray-100 flex items-center gap-2">
                        {format(currentMonth, "MMMM yyyy")}
                    </h2>
                </div>
                <div className="flex items-center gap-2">
                     <button
                        onClick={today}
                        className="px-3 py-1.5 text-xs font-medium text-gray-300 hover:text-gray-100 bg-bg-base hover:bg-gray-800 rounded-md border border-border-subtle transition-colors"
                    >
                        Today
                    </button>
                    <div className="flex bg-bg-base border border-border-subtle rounded-lg overflow-hidden">
                        <button
                            onClick={prevMonth}
                            className="p-1.5 text-gray-400 hover:text-gray-100 hover:bg-gray-800 transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <div className="w-[1px] bg-border-subtle"></div>
                        <button
                            onClick={nextMonth}
                            className="p-1.5 text-gray-400 hover:text-gray-100 hover:bg-gray-800 transition-colors"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
            
            <div className="grid grid-cols-7 border-b border-border-subtle bg-bg-base/30">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                    <div key={day} className="py-2 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        {day}
                    </div>
                ))}
            </div>
            
            <div className="flex flex-col">
                {rows}
            </div>
        </div>
    );
}
