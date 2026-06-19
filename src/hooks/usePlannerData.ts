import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, onSnapshot, doc, writeBatch, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { format, addDays } from 'date-fns';
import { Subject } from '../data/jeeSyllabus';

export interface PlanItem {
    id: string;
    subject: Subject;
    topic: string;
    questionsGoal: number;
    timeAllocationMinutes: number;
    dateStr: string;
    completed: boolean;
    createdAt?: any;
}

export function usePlannerData() {
    const { user } = useAuth();
    const [planItems, setPlanItems] = useState<PlanItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        if ('isMock' in user && user.isMock) {
            const loadMockData = () => {
                const itemsStr = localStorage.getItem(`jeecommand_mock_planItems_${user.uid}`) || '[]';
                setPlanItems(JSON.parse(itemsStr));
                setLoading(false);
            };
            loadMockData();
            
            const interval = setInterval(loadMockData, 1000);
            return () => clearInterval(interval);
        }

        const today = format(new Date(), 'yyyy-MM-dd');
        // We'll query from 30 days ago to future, or just all for this user, it shouldn't be huge
        // To be scalable, we get items from previous few days and future
        const q = query(
            collection(db, `users/${user.uid}/planItems`),
        );
        const unsubscribe = onSnapshot(q, (snap) => {
            const items: PlanItem[] = [];
            snap.forEach(doc => {
                items.push({ id: doc.id, ...doc.data() } as PlanItem);
            });
            setPlanItems(items);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const saveDayPlan = async (dateStr: string, itemsToSave: any[], itemsToRemove: string[]) => {
        if (!user) return;

        if ('isMock' in user && user.isMock) {
            const itemsStr = localStorage.getItem(`jeecommand_mock_planItems_${user.uid}`) || '[]';
            let mockItems: PlanItem[] = JSON.parse(itemsStr);
            
            mockItems = mockItems.filter(i => !itemsToRemove.includes(i.id));
            
            itemsToSave.forEach(i => {
                 if (i.id) {
                     // update existing
                     mockItems = mockItems.map(m => m.id === i.id ? { ...m, ...i } : m);
                 } else {
                     // create new
                     mockItems.push({
                         ...i,
                         id: Math.random().toString(),
                         completed: false,
                         dateStr,
                         createdAt: new Date().toISOString()
                     });
                 }
            });

            localStorage.setItem(`jeecommand_mock_planItems_${user.uid}`, JSON.stringify(mockItems));
            return;
        }

        const batch = writeBatch(db);
        
        itemsToRemove.forEach(id => {
            batch.delete(doc(db, `users/${user.uid}/planItems`, id));
        });

        itemsToSave.forEach(item => {
            if (item.id) {
                 const ref = doc(db, `users/${user.uid}/planItems`, item.id);
                 batch.update(ref, {
                     subject: item.subject,
                     topic: item.topic,
                     questionsGoal: item.questionsGoal,
                     timeAllocationMinutes: item.timeAllocationMinutes,
                 });
            } else {
                 const ref = doc(collection(db, `users/${user.uid}/planItems`));
                 batch.set(ref, {
                     subject: item.subject,
                     topic: item.topic,
                     questionsGoal: item.questionsGoal,
                     timeAllocationMinutes: item.timeAllocationMinutes,
                     dateStr,
                     completed: false,
                     createdAt: serverTimestamp()
                 });
            }
        });

        await batch.commit();
    };

    const toggleComplete = async (id: string, currentStatus: boolean) => {
        if (!user) return;
        if ('isMock' in user && user.isMock) {
             const itemsStr = localStorage.getItem(`jeecommand_mock_planItems_${user.uid}`) || '[]';
             let mockItems: PlanItem[] = JSON.parse(itemsStr);
             mockItems = mockItems.map(i => i.id === id ? { ...i, completed: !currentStatus } : i);
             localStorage.setItem(`jeecommand_mock_planItems_${user.uid}`, JSON.stringify(mockItems));
             return;
        }

        await updateDoc(doc(db, `users/${user.uid}/planItems`, id), {
            completed: !currentStatus
        });
    };

    return { planItems, loading, saveDayPlan, toggleComplete };
}
