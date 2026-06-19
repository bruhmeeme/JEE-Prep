import React, { useState } from 'react';
import { CountdownDisplay } from '../components/dashboard/CountdownDisplay';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { LogStudyModal } from '../components/dashboard/LogStudyModal';
import { useDashboardData } from '../hooks/useDashboardData';
import { usePlannerData } from '../hooks/usePlannerData';
import { useTestsData } from '../hooks/useTestsData';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import { Clock, TrendingUp, CheckCircle, Target, Edit2, Circle, AlertCircle } from 'lucide-react';
import { format, differenceInDays, startOfDay } from 'date-fns';
import { SUBJECT_COLORS } from '../data/jeeSyllabus';
import { db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { useNavigate } from 'react-router-dom';

export function Dashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [isLogModalOpen, setIsLogModalOpen] = useState(false);
    const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
    const [editGoal, setEditGoal] = useState('');
    
    const { 
        todayMinutes, weekMinutes, syllabusCompletion, dailyStats, 
        subjectStats, dailyGoal, topicsCompleted, totalTopics 
    } = useDashboardData();
    const { planItems, toggleComplete } = usePlannerData();
    const { tests } = useTestsData();

    // Sort logic, safely handle parsing dates
    const safeDateSort = (a: any, b: any) => {
        const da = a.dateStr ? new Date(a.dateStr).getTime() : 0;
        const db = b.dateStr ? new Date(b.dateStr).getTime() : 0;
        const validDa = isNaN(da) ? 0 : da;
        const validDb = isNaN(db) ? 0 : db;
        return validDa - validDb;
    };

    const sortedTests = [...tests].sort(safeDateSort);
    const today = startOfDay(new Date());
    
    const nearestUpcomingTest = sortedTests.find(t => {
        const d = startOfDay(new Date(t.dateStr + 'T12:00:00'));
        const days = differenceInDays(d, today);
        return days >= 0 && days <= 14;
    });

    const formatHours = (mins: number) => {
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return `${h}h ${m}m`;
    };

    const handleOpenGoalModal = () => {
        setEditGoal(dailyGoal.toString());
        setIsGoalModalOpen(true);
    };

    const handleSaveGoal = async (e: React.FormEvent) => {
        e.preventDefault();
        const goalMins = parseInt(editGoal, 10);
        if (!user || isNaN(goalMins) || goalMins <= 0) return;

        if ('isMock' in user && user.isMock) {
            const mockDataStr = localStorage.getItem(`jeecommand_mock_data_${user.uid}`) || '{}';
            const mData = JSON.parse(mockDataStr);
            mData.dailyStudyGoalMinutes = goalMins;
            localStorage.setItem(`jeecommand_mock_data_${user.uid}`, JSON.stringify(mData));
        } else {
             await setDoc(doc(db, "users", user.uid), { dailyStudyGoalMinutes: goalMins }, { merge: true });
        }
        setIsGoalModalOpen(false);
    };

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-bg-card border border-border-subtle p-3 rounded-lg shadow-xl">
                    <p className="text-gray-200 font-medium mb-1">{label}</p>
                    <p className="text-brand text-sm">
                        Total: {formatHours(payload[0].value)}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 md:mb-8">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-100 tracking-tight">Dashboard</h1>
                    <p className="text-gray-400 mt-2">Overview of your mission progress.</p>
                </div>
                <Button onClick={() => setIsLogModalOpen(true)} className="w-full md:w-auto shadow-lg shadow-brand/20">
                    <Clock className="w-4 h-4 mr-2" /> Log Study Time
                </Button>
            </header>

            <section className="bg-bg-card rounded-xl border border-border-subtle p-6 shadow-sm">
                <CountdownDisplay />
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Today's Plan</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {planItems.filter(i => i.dateStr === format(new Date(), 'yyyy-MM-dd')).length === 0 ? (
                            <div className="py-6 text-center flex flex-col items-center">
                                <h3 className="text-gray-300 font-medium tracking-tight mb-1">No tasks today</h3>
                                <p className="text-gray-500 text-sm mb-4">Go to the Planner to schedule your study sessions.</p>
                                <Button variant="outline" size="sm" onClick={() => navigate('/planner')}>
                                    Go to Planner
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {planItems.filter(i => i.dateStr === format(new Date(), 'yyyy-MM-dd')).map(item => (
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
                        )}
                    </CardContent>
                </Card>

                 {nearestUpcomingTest ? (() => {
                     const testDate = startOfDay(new Date(nearestUpcomingTest.dateStr + 'T12:00:00'));
                     const daysUntil = differenceInDays(testDate, today);
                     return (
                         <div className="h-full border border-brand/20 bg-brand/5 rounded-xl p-6 flex flex-col justify-center relative overflow-hidden">
                             <div className="absolute -right-4 -top-4 w-24 h-24 bg-brand/10 rounded-full blur-xl" />
                             <div className="flex items-center gap-2 mb-2">
                                  <AlertCircle className="w-5 h-5 text-brand" />
                                  <h3 className="font-semibold text-brand tracking-tight">Upcoming Test Reminder</h3>
                             </div>
                             <p className="text-xl font-bold text-gray-100 mb-1">{nearestUpcomingTest.name}</p>
                             <p className="text-sm text-gray-400 mb-5">
                                 {format(testDate, 'MMMM d, yyyy')} • 
                                 <span className="text-gray-200 font-medium ml-1">
                                     {daysUntil === 0 ? "Today" : daysUntil === 1 ? "Tomorrow" : `In ${daysUntil} days`}
                                 </span>
                             </p>
                             {nearestUpcomingTest.syllabus && nearestUpcomingTest.syllabus.length > 0 && (
                                 <div className="flex flex-col gap-2 mt-auto">
                                     <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Syllabus Overview</h4>
                                     {nearestUpcomingTest.syllabus.map((s, idx) => (
                                         <div key={idx} className="flex gap-2.5 items-center">
                                             <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: SUBJECT_COLORS[s.subject] }} />
                                             <div className="flex flex-wrap items-baseline gap-2 min-w-0">
                                                 <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider shrink-0">{s.subject}</span>
                                                 <span className="text-sm text-gray-300 truncate">{s.topics}</span>
                                             </div>
                                         </div>
                                     ))}
                                 </div>
                             )}
                         </div>
                     );
                 })() : null}
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-bg-card relative overflow-hidden">
                    <div className="absolute right-0 top-0 opacity-5 p-4 md:p-6 pointer-events-none">
                        <Clock className="w-12 h-12 md:w-16 md:h-16" />
                    </div>
                    <CardContent className="p-4 md:p-6">
                        <div className="text-gray-400 text-xs md:text-sm font-medium mb-1">Today's Study Time</div>
                        <div className="text-xl md:text-3xl font-bold text-gray-100">{formatHours(todayMinutes)}</div>
                    </CardContent>
                </Card>
                <Card className="bg-bg-card relative overflow-hidden">
                    <div className="absolute right-0 top-0 opacity-5 p-4 md:p-6 pointer-events-none">
                        <TrendingUp className="w-12 h-12 md:w-16 md:h-16" />
                    </div>
                    <CardContent className="p-4 md:p-6">
                        <div className="text-gray-400 text-xs md:text-sm font-medium mb-1">Weekly Study Time</div>
                        <div className="text-xl md:text-3xl font-bold text-gray-100">{formatHours(weekMinutes)}</div>
                    </CardContent>
                </Card>
                 <Card className="bg-bg-card relative overflow-hidden">
                    <div className="absolute right-0 top-0 opacity-5 p-4 md:p-6 pointer-events-none">
                        <Target className="w-12 h-12 md:w-16 md:h-16" />
                    </div>
                    <CardContent className="p-4 md:p-6 relative">
                        <div className="flex justify-between items-start">
                            <div className="text-gray-400 text-xs md:text-sm font-medium mb-1">Daily Goal</div>
                            <button onClick={handleOpenGoalModal} className="text-gray-500 hover:text-brand z-10"><Edit2 className="w-3.5 h-3.5"/></button>
                        </div>
                        <div className="text-xl md:text-3xl font-bold text-gray-100">{formatHours(dailyGoal)}</div>
                    </CardContent>
                </Card>
                <Card className="bg-bg-card relative overflow-hidden">
                    <div className="absolute right-0 top-0 opacity-5 p-4 md:p-6 pointer-events-none">
                        <CheckCircle className="w-12 h-12 md:w-16 md:h-16" />
                    </div>
                    <CardContent className="p-4 md:p-6">
                        <div className="text-gray-400 text-xs md:text-sm font-medium mb-1">Overall Syllabus</div>
                        <div className="text-xl md:text-3xl font-bold text-gray-100">{syllabusCompletion}%</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 7-Day Line Graph */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Study Trend (Last 7 Days)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-72 mt-4">
                            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                <AreaChart data={dailyStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorBrand" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--color-brand)" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="var(--color-brand)" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#232838" vertical={false} />
                                    <XAxis dataKey="dateStr" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${Math.floor(val/60)}h`} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <ReferenceLine y={dailyGoal} stroke="#6b7280" strokeDasharray="3 3" label={{ position: 'top', value: 'Goal', fill: '#6b7280', fontSize: 10 }} />
                                    <Area 
                                        type="monotone" 
                                        dataKey="actualMinutes" 
                                        stroke="var(--color-brand)" 
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorBrand)"
                                        dot={{ r: 4, fill: '#141724', stroke: 'var(--color-brand)', strokeWidth: 2 }}
                                        activeDot={{ r: 6, fill: 'var(--color-brand)' }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Subject Breakdown & Progress */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Weekly Subject Split</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-40">
                                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                    <BarChart data={subjectStats} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#232838" horizontal={false} />
                                        <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} tickFormatter={(val) => `${Math.floor(val/60)}h`} />
                                        <YAxis dataKey="subject" type="category" axisLine={false} tickLine={false} width={75} tick={{ fill: '#9ca3af', fontSize: 12 }} tickFormatter={(val) => val.charAt(0).toUpperCase() + val.slice(1)} />
                                        <Tooltip 
                                            cursor={{fill: 'transparent'}}
                                            content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                    const data = payload[0].payload;
                                                    return (
                                                        <div className="bg-bg-card border border-border-subtle p-2 rounded shadow-lg text-sm">
                                                            <span className="capitalize font-medium text-gray-200">{data.subject}: </span>
                                                            <span className="text-gray-400">{formatHours(data.minutes)}</span>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }} 
                                        />
                                        <Bar dataKey="minutes" radius={[0, 4, 4, 0]} barSize={24}>
                                            {subjectStats.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={SUBJECT_COLORS[entry.subject]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Syllabus Progress</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-subject-physics font-medium">Physics</span>
                                    <span className="text-gray-400">{topicsCompleted.physics}/{totalTopics.physics}</span>
                                </div>
                                <div className="h-2 w-full bg-border-subtle rounded-full overflow-hidden">
                                     <div className="h-full bg-subject-physics rounded-full transition-all" style={{width: `${totalTopics.physics ? (topicsCompleted.physics/totalTopics.physics)*100 : 0}%`}}></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-subject-chemistry font-medium">Chemistry</span>
                                    <span className="text-gray-400">{topicsCompleted.chemistry}/{totalTopics.chemistry}</span>
                                </div>
                                <div className="h-2 w-full bg-border-subtle rounded-full overflow-hidden">
                                     <div className="h-full bg-subject-chemistry rounded-full transition-all" style={{width: `${totalTopics.chemistry ? (topicsCompleted.chemistry/totalTopics.chemistry)*100 : 0}%`}}></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-subject-maths font-medium">Maths</span>
                                    <span className="text-gray-400">{topicsCompleted.maths}/{totalTopics.maths}</span>
                                </div>
                                <div className="h-2 w-full bg-border-subtle rounded-full overflow-hidden">
                                     <div className="h-full bg-subject-maths rounded-full transition-all" style={{width: `${totalTopics.maths ? (topicsCompleted.maths/totalTopics.maths)*100 : 0}%`}}></div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <LogStudyModal isOpen={isLogModalOpen} onClose={() => setIsLogModalOpen(false)} />

            <Modal isOpen={isGoalModalOpen} onClose={() => setIsGoalModalOpen(false)} title="Set Daily Study Goal">
                <form onSubmit={handleSaveGoal} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="goalMins">Daily Goal (minutes)</Label>
                        <Input
                            id="goalMins"
                            type="number"
                            min="1"
                            value={editGoal}
                            onChange={(e) => setEditGoal(e.target.value)}
                            required
                        />
                        <p className="text-xs text-gray-500 mt-1">That's ≈ {formatHours(parseInt(editGoal || '0', 10))}</p>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="ghost" onClick={() => setIsGoalModalOpen(false)}>Cancel</Button>
                        <Button type="submit" variant="primary">Save Changes</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
