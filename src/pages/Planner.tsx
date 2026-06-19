import React, { useState } from 'react';
import { usePlannerData, PlanItem } from '../hooks/usePlannerData';
import { PlannerCalendar } from '../components/planner/PlannerCalendar';
import { DayPlanModal } from '../components/planner/DayPlanModal';
import { format, isAfter, isBefore, addDays, startOfDay } from 'date-fns';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { CheckCircle, Circle } from 'lucide-react';
import { SUBJECT_COLORS } from '../data/jeeSyllabus';

export function Planner() {
    const { planItems, loading, saveDayPlan, toggleComplete } = usePlannerData();
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    const today = startOfDay(new Date());
    const sevenDaysLater = addDays(today, 7);

    const next7DaysItems = planItems
        .filter(i => {
            const itemDate = startOfDay(new Date(i.dateStr ? i.dateStr + 'T12:00:00' : Date.now()));
            return (itemDate.getTime() >= today.getTime() || i.dateStr === format(today, 'yyyy-MM-dd')) && itemDate <= sevenDaysLater;
        })
        .sort((a, b) => {
            const da = a.dateStr ? new Date(a.dateStr).getTime() : 0;
            const db = b.dateStr ? new Date(b.dateStr).getTime() : 0;
            const validDa = isNaN(da) ? 0 : da;
            const validDb = isNaN(db) ? 0 : db;
            return validDa - validDb;
        });

    const groupItemsByDate = (items: typeof planItems) => {
        const groups: Record<string, typeof planItems> = {};
        items.forEach(i => {
            if (!groups[i.dateStr]) groups[i.dateStr] = [];
            groups[i.dateStr].push(i);
        });
        return groups;
    };

    const next7DaysGroups = groupItemsByDate(next7DaysItems);
    const sortedDates = Object.keys(next7DaysGroups).sort();

    return (
        <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">
            <header className="mb-6 md:mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-100 tracking-tight">Daily Planner</h1>
                <p className="text-gray-400 mt-2">Schedule your topics and problem-solving targets.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <PlannerCalendar 
                        planItems={planItems} 
                        onDateSelect={setSelectedDate} 
                    />
                </div>

                <div className="space-y-6">
                    <Card className="h-full border border-border-subtle shadow-sm bg-bg-card flex flex-col">
                        <CardHeader className="border-b border-border-subtle bg-bg-base/30 px-6 py-4">
                            <CardTitle>Next 7 Days</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 overflow-y-auto max-h-[600px] flex-1">
                            {sortedDates.length === 0 ? (
                                <div className="p-8 text-center flex flex-col items-center">
                                    <h3 className="text-gray-300 font-medium tracking-tight mb-1">No tasks planned</h3>
                                    <p className="text-gray-500 text-sm">Select a date on the calendar to schedule tasks for the next 7 days.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-border-subtle">
                                    {sortedDates.map(dateStr => (
                                        <div key={dateStr} className="p-4">
                                            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                                                {format(new Date(dateStr + 'T12:00:00'), 'MMM d, EEEE')}
                                            </h4>
                                            <div className="space-y-2">
                                                {next7DaysGroups[dateStr].map(item => (
                                                    <div key={item.id} className="flex gap-3 items-start group">
                                                        <button 
                                                            onClick={() => toggleComplete(item.id, item.completed)}
                                                            className="mt-0.5 text-gray-500 hover:text-brand transition-colors"
                                                        >
                                                            {item.completed ? <CheckCircle className="w-4 h-4 text-brand" /> : <Circle className="w-4 h-4" />}
                                                        </button>
                                                        <div className="flex-1 min-w-0 flex items-center justify-between gap-3">
                                                            <div className="flex items-center gap-2 min-w-0">
                                                                 <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: SUBJECT_COLORS[item.subject] }} />
                                                                 <span className={`text-sm font-medium ${item.completed ? 'text-gray-500 line-through' : 'text-gray-200'} truncate`}>
                                                                     {item.topic}
                                                                 </span>
                                                            </div>
                                                            <span className={`text-xs shrink-0 ${item.completed ? 'text-gray-600' : 'text-gray-500'}`}>
                                                                {item.questionsGoal} Qs • {item.timeAllocationMinutes}m
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            <DayPlanModal 
                isOpen={!!selectedDate} 
                onClose={() => setSelectedDate(null)}
                date={selectedDate}
                existingItems={selectedDate ? planItems.filter(i => i.dateStr === format(selectedDate, 'yyyy-MM-dd')) : []}
                onSave={saveDayPlan}
            />
        </div>
    );
}
