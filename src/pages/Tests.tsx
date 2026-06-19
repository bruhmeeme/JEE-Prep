import React, { useState } from 'react';
import { useTestsData, Test } from '../hooks/useTestsData';
import { TestModal } from '../components/tests/TestModal';
import { format, isBefore, startOfDay, differenceInDays } from 'date-fns';
import { Button } from '../components/ui/Button';
import { Plus, Edit2, Trash2, Calendar as CalendarIcon } from 'lucide-react';
import { SUBJECT_COLORS } from '../data/jeeSyllabus';
import { cn } from '../lib/utils';
import { Card, CardContent } from '../components/ui/Card';

export function Tests() {
    const { tests, loading, saveTest, deleteTest } = useTestsData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTest, setEditingTest] = useState<Test | null>(null);
    const [activeTab, setActiveTab] = useState<'UPCOMING' | 'PAST'>('UPCOMING');

    const today = startOfDay(new Date());

    // Sort logic, safely handle parsing dates
    const safeDateSort = (a: any, b: any) => {
        const da = a.dateStr ? new Date(a.dateStr).getTime() : 0;
        const db = b.dateStr ? new Date(b.dateStr).getTime() : 0;
        // ensure valid time value
        const validDa = isNaN(da) ? 0 : da;
        const validDb = isNaN(db) ? 0 : db;
        return validDa - validDb;
    };

    const sortedTests = [...tests].sort(safeDateSort);

    const upcomingTests = sortedTests.filter(t => {
        const d = startOfDay(new Date(t.dateStr + 'T12:00:00'));
        return d.getTime() >= today.getTime();
    });

    const pastTests = sortedTests.filter(t => {
        const d = startOfDay(new Date(t.dateStr + 'T12:00:00'));
        return d.getTime() < today.getTime();
    }).reverse(); // Most recent past test first

    const displayedTests = activeTab === 'UPCOMING' ? upcomingTests : pastTests;

    const handleEdit = (test: Test) => {
        setEditingTest(test);
        setIsModalOpen(true);
    };

    const handleAdd = () => {
        setEditingTest(null);
        setIsModalOpen(true);
    };

    const getDaysLabel = (dateStr: string) => {
        const d = startOfDay(new Date(dateStr + 'T12:00:00'));
        const diff = differenceInDays(d, today);
        if (diff === 0) return "Today";
        if (diff === 1) return "Tomorrow";
        if (diff === -1) return "Yesterday";
        if (diff > 0) return `${diff} days away`;
        return `${Math.abs(diff)} days ago`;
    };

    return (
        <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 md:mb-8">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-100 tracking-tight">Mock Tests</h1>
                    <p className="text-gray-400 mt-2">Log upcoming exams, syllabus, and preparedness.</p>
                </div>
                <Button onClick={handleAdd} className="w-full md:w-auto shadow-lg shadow-brand/20">
                    <Plus className="w-4 h-4 mr-2" /> Add Test
                </Button>
            </header>

            <div className="bg-bg-card rounded-xl border border-border-subtle shadow-sm overflow-hidden flex flex-col">
                <div className="flex border-b border-border-subtle p-2 gap-2">
                     <button
                        onClick={() => setActiveTab('UPCOMING')}
                        className={cn(
                            "px-4 py-1.5 text-sm font-medium transition-all rounded-md flex-1 md:flex-none text-center",
                            activeTab === 'UPCOMING'
                                ? "bg-brand text-white shadow-sm" 
                                : "text-gray-400 hover:text-gray-200 hover:bg-bg-base/50"
                        )}
                    >
                        Upcoming Tests
                    </button>
                    <button
                        onClick={() => setActiveTab('PAST')}
                        className={cn(
                            "px-4 py-1.5 text-sm font-medium transition-all rounded-md flex-1 md:flex-none text-center",
                            activeTab === 'PAST'
                                ? "bg-brand text-white shadow-sm" 
                                : "text-gray-400 hover:text-gray-200 hover:bg-bg-base/50"
                        )}
                    >
                        Past Tests
                    </button>
                </div>

                <div className="p-4 md:p-6 space-y-4">
                    {loading ? (
                         <div className="space-y-4">
                            {[1, 2].map(i => <div key={i} className="h-40 bg-bg-base/50 animate-pulse rounded-xl border border-border-subtle" />)}
                        </div>
                    ) : displayedTests.length === 0 ? (
                        <div className="py-12 text-center flex flex-col items-center">
                            <div className="w-12 h-12 rounded-full bg-bg-base flex items-center justify-center mb-3 border border-border-subtle">
                                <CalendarIcon className="w-6 h-6 text-gray-500" />
                            </div>
                            <h3 className="text-gray-200 font-medium tracking-tight">No {activeTab.toLowerCase()} tests found</h3>
                            <p className="text-gray-400 text-sm mt-1 mb-4 max-w-xs">
                                {activeTab === 'UPCOMING' 
                                    ? "Add an upcoming test to start tracking your preparedness."
                                    : "You haven't logged any past tests yet."}
                            </p>
                            <Button variant="outline" size="sm" onClick={handleAdd}>
                                <Plus className="w-4 h-4 mr-2" /> Add Test
                            </Button>
                        </div>
                    ) : (
                        displayedTests.map(test => (
                            <Card key={test.id} className="border border-border-subtle bg-bg-base overflow-hidden">
                                <CardContent className="p-0">
                                    <div className="p-4 md:p-5 flex flex-col md:flex-row gap-4 justify-between md:items-center border-b border-border-subtle/50 relative">
                                        <div className="pr-16 md:pr-0">
                                            <div className="flex items-center gap-3 mb-1">
                                                <h3 className="text-lg font-semibold text-gray-100">{test.name}</h3>
                                                <span className={cn(
                                                    "px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap",
                                                    activeTab === 'UPCOMING' ? "bg-brand/10 text-brand border border-brand/20" : "bg-gray-800 text-gray-400 border border-gray-700"
                                                )}>
                                                    {getDaysLabel(test.dateStr)}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-400">Date: {format(new Date(test.dateStr + 'T12:00:00'), 'MMMM d, yyyy')}</p>
                                        </div>
                                        
                                        <div className="flex items-center gap-6 md:gap-10 pr-12 md:pr-20 md:flex-1 md:justify-end">
                                            {activeTab === 'PAST' && test.marksObtained !== undefined && test.totalMarks && (
                                                <div className="flex flex-col text-right shrink-0">
                                                    <span className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-0.5">Score</span>
                                                    <span className="text-lg font-bold text-gray-100 tabular-nums">
                                                        {test.marksObtained}
                                                        <span className="text-sm text-gray-500 font-normal">/{test.totalMarks}</span>
                                                    </span>
                                                </div>
                                            )}
                                            <div className="flex flex-col gap-1 w-40 md:flex-1 md:max-w-xs">
                                                <div className="flex justify-between text-xs text-gray-400 font-medium">
                                                    <span>Preparedness</span>
                                                    <span>{test.preparedness}%</span>
                                                </div>
                                                <div className="h-2 w-full bg-bg-card rounded-full overflow-hidden border border-border-subtle/50">
                                                    <div 
                                                        className="h-full bg-gradient-to-r from-brand/80 to-brand rounded-full transition-all duration-500"
                                                        style={{ width: `${test.preparedness}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="absolute top-4 right-4 flex items-center gap-1">
                                            <button onClick={() => handleEdit(test)} className="p-1.5 text-gray-500 hover:text-brand hover:bg-brand/10 rounded transition-colors">
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => deleteTest(test.id)} className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                    
                                    {test.syllabus && test.syllabus.length > 0 && (
                                        <div className="p-4 md:p-5 bg-bg-base/30 flex flex-col gap-2">
                                            {test.syllabus.map((s, idx) => (
                                                <div key={idx} className="flex gap-2.5 items-center">
                                                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: SUBJECT_COLORS[s.subject] }} />
                                                    <div className="flex flex-wrap items-baseline gap-2 min-w-0">
                                                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider shrink-0">{s.subject}</span>
                                                        <span className="text-sm text-gray-300 break-words">{s.topics}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>

            <TestModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                test={editingTest} 
                onSave={saveTest} 
            />
        </div>
    );
}
