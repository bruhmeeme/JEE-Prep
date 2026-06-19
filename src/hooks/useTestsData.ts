import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, onSnapshot, doc, setDoc, deleteDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Subject } from '../data/jeeSyllabus';

export interface TestSyllabusEntry {
    subject: Subject;
    topics: string;
}

export interface Test {
    id: string;
    name: string;
    dateStr: string;
    preparedness: number;
    syllabus: TestSyllabusEntry[];
    marksObtained?: number;
    totalMarks?: number;
    createdAt?: any;
}

export function useTestsData() {
    const { user } = useAuth();
    const [tests, setTests] = useState<Test[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        if ('isMock' in user && user.isMock) {
            const loadMockData = () => {
                const itemsStr = localStorage.getItem(`jeecommand_mock_tests_${user.uid}`) || '[]';
                setTests(JSON.parse(itemsStr));
                setLoading(false);
            };
            loadMockData();
            
            const interval = setInterval(loadMockData, 1000);
            return () => clearInterval(interval);
        }

        const q = query(collection(db, `users/${user.uid}/tests`));
        const unsubscribe = onSnapshot(q, (snap) => {
            const items: Test[] = [];
            snap.forEach(doc => {
                items.push({ id: doc.id, ...doc.data() } as Test);
            });
            setTests(items.sort((a, b) => new Date(a.dateStr).getTime() - new Date(b.dateStr).getTime()));
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const saveTest = async (testToSave: Omit<Test, 'id' | 'createdAt'> & { id?: string }) => {
        if (!user) return;

        if ('isMock' in user && user.isMock) {
            const itemsStr = localStorage.getItem(`jeecommand_mock_tests_${user.uid}`) || '[]';
            let mockItems: Test[] = JSON.parse(itemsStr);
            
            if (testToSave.id) {
                mockItems = mockItems.map(t => t.id === testToSave.id ? { ...t, ...testToSave } : t);
            } else {
                mockItems.push({
                    ...testToSave,
                    id: Math.random().toString(),
                    createdAt: new Date().toISOString()
                });
            }

            localStorage.setItem(`jeecommand_mock_tests_${user.uid}`, JSON.stringify(mockItems));
            return;
        }

        if (testToSave.id) {
             const ref = doc(db, `users/${user.uid}/tests`, testToSave.id);
             await updateDoc(ref, {
                 name: testToSave.name,
                 dateStr: testToSave.dateStr,
                 preparedness: testToSave.preparedness,
                 syllabus: testToSave.syllabus,
                 ...(testToSave.marksObtained !== undefined && { marksObtained: testToSave.marksObtained }),
                 ...(testToSave.totalMarks !== undefined && { totalMarks: testToSave.totalMarks })
             });
        } else {
             const ref = doc(collection(db, `users/${user.uid}/tests`));
             await setDoc(ref, {
                 ...testToSave,
                 createdAt: serverTimestamp()
             });
        }
    };

    const deleteTest = async (id: string) => {
        if (!user) return;
        if ('isMock' in user && user.isMock) {
             const itemsStr = localStorage.getItem(`jeecommand_mock_tests_${user.uid}`) || '[]';
             let mockItems: Test[] = JSON.parse(itemsStr);
             mockItems = mockItems.filter(i => i.id !== id);
             localStorage.setItem(`jeecommand_mock_tests_${user.uid}`, JSON.stringify(mockItems));
             return;
        }

        await deleteDoc(doc(db, `users/${user.uid}/tests`, id));
    };

    return { tests, loading, saveTest, deleteTest };
}
