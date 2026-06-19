import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, onSnapshot, where, getDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { startOfDay, endOfDay, subDays, startOfWeek, endOfWeek, isSameDay, format } from 'date-fns';
import { JEE_SYLLABUS, Subject } from '../data/jeeSyllabus';

export interface DailyStudyStat {
    dateStr: string;
    actualMinutes: number;
    goalMinutes: number;
}

export interface SubjectStat {
    subject: Subject;
    minutes: number;
}

export function useDashboardData() {
    const { user } = useAuth();
    const [todayMinutes, setTodayMinutes] = useState(0);
    const [weekMinutes, setWeekMinutes] = useState(0);
    const [syllabusCompletion, setSyllabusCompletion] = useState(0);
    const [dailyStats, setDailyStats] = useState<DailyStudyStat[]>([]);
    const [subjectStats, setSubjectStats] = useState<SubjectStat[]>([]);
    const [dailyGoal, setDailyGoal] = useState(240);
    const [topicsCompleted, setTopicsCompleted] = useState({ physics: 0, chemistry: 0, maths: 0 });

    useEffect(() => {
        if (!user) return;

        let unsubUser = () => {};
        let unsubLogs = () => {};
        let unsubTopics = () => {};

        const todayStart = startOfDay(new Date());
        const todayEnd = endOfDay(new Date());
        const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
        const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
        const sevenDaysAgo = startOfDay(subDays(new Date(), 6));

        // Define a function to process logs internally
        const processLogs = (logs: any[]) => {
            let todaySum = 0;
            let weekSum = 0;
            const dailyMap = new Map<string, number>();
            const subjMap: Record<Subject, number> = { physics: 0, chemistry: 0, maths: 0 };

            for (let i = 6; i >= 0; i--) {
                const dateStr = format(subDays(new Date(), i), 'MMM dd');
                dailyMap.set(dateStr, 0);
            }

            logs.forEach(log => {
                if (log.date >= todayStart && log.date <= todayEnd) {
                    todaySum += log.durationMinutes || 0;
                }
                if (log.date >= weekStart && log.date <= weekEnd) {
                    weekSum += log.durationMinutes || 0;
                    const sub = log.subject as Subject;
                    if (subjMap[sub] !== undefined) {
                        subjMap[sub] += log.durationMinutes || 0;
                    }
                }
                if (log.date >= sevenDaysAgo) {
                    const dateStr = format(log.date, 'MMM dd');
                    if (dailyMap.has(dateStr)) {
                        dailyMap.set(dateStr, dailyMap.get(dateStr)! + (log.durationMinutes || 0));
                    }
                }
            });

            setTodayMinutes(todaySum);
            setWeekMinutes(weekSum);
            
            const newDailyStats: DailyStudyStat[] = [];
            dailyMap.forEach((val, key) => {
                newDailyStats.push({ dateStr: key, actualMinutes: val, goalMinutes: dailyGoal });
            });
            setDailyStats(newDailyStats);
            
            setSubjectStats([
                { subject: 'physics', minutes: subjMap.physics },
                { subject: 'chemistry', minutes: subjMap.chemistry },
                { subject: 'maths', minutes: subjMap.maths }
            ]);
        };

        const updateTopicsStats = (completed: any[]) => {
            const totalSyllabus = JEE_SYLLABUS.physics.length + JEE_SYLLABUS.chemistry.length + JEE_SYLLABUS.maths.length;
            const subjCounts = { physics: 0, chemistry: 0, maths: 0 };
            completed.forEach(t => {
                if (t.subject === 'physics') subjCounts.physics++;
                else if (t.subject === 'chemistry') subjCounts.chemistry++;
                else if (t.subject === 'maths') subjCounts.maths++;
            });

            setTopicsCompleted(subjCounts);
            
            if (totalSyllabus > 0) {
                setSyllabusCompletion(Math.round((completed.length / totalSyllabus) * 100));
            }
        };

        if ('isMock' in user && user.isMock) {
            // Mock Data Processing
            const loadMockData = () => {
                const mockDataStr = localStorage.getItem(`jeecommand_mock_data_${user.uid}`);
                if (mockDataStr) {
                    try {
                        const mData = JSON.parse(mockDataStr);
                        if (mData.dailyStudyGoalMinutes) setDailyGoal(mData.dailyStudyGoalMinutes);
                    } catch(e){}
                }

                const logsStr = localStorage.getItem(`jeecommand_mock_logs_${user.uid}`);
                const parsedLogs = logsStr ? JSON.parse(logsStr).map((l: any) => ({ ...l, date: new Date(l.date) })) : [];
                processLogs(parsedLogs);

                // For mock syllabus topics
                const topicsStr = localStorage.getItem(`jeecommand_mock_topics_${user.uid}`) || '[]';
                const topics = JSON.parse(topicsStr);
                const completed = topics.filter((t: any) => t.status === 'COMPLETED');
                updateTopicsStats(completed);
            };

            loadMockData();
            
            const mockInterval = setInterval(loadMockData, 2000);
            return () => clearInterval(mockInterval);
        }

        unsubUser = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
            if (docSnap.exists() && docSnap.data().dailyStudyGoalMinutes) {
                setDailyGoal(docSnap.data().dailyStudyGoalMinutes);
            }
        });

        const earliestQueryDate = sevenDaysAgo < weekStart ? sevenDaysAgo : weekStart;
        const qLogs = query(
            collection(db, `users/${user.uid}/studyLogs`),
            where("date", ">=", earliestQueryDate)
        );

        unsubLogs = onSnapshot(qLogs, (snap) => {
            const logs = snap.docs.map(d => ({ ...d.data(), id: d.id, date: d.data().date?.toDate() || new Date() }));
            processLogs(logs);
        });

        // Listen to topics
        const qTopics = query(collection(db, `users/${user.uid}/topics`), where("status", "==", "COMPLETED"));
        unsubTopics = onSnapshot(qTopics, (snap) => {
            const completed = snap.docs.map(d => d.data());
            updateTopicsStats(completed);
        });

        return () => {
            unsubUser();
            unsubLogs();
            unsubTopics();
        };
    }, [user, dailyGoal]);

    return {
        todayMinutes,
        weekMinutes,
        syllabusCompletion,
        dailyStats,
        subjectStats,
        dailyGoal,
        topicsCompleted,
        totalTopics: {
            physics: JEE_SYLLABUS.physics.length,
            chemistry: JEE_SYLLABUS.chemistry.length,
            maths: JEE_SYLLABUS.maths.length
        }
    };
}
