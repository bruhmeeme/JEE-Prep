import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, onSnapshot, doc, deleteDoc, updateDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Subject, JEE_SYLLABUS } from '../data/jeeSyllabus';

export interface UserTopic {
    id: string;
    subject: Subject;
    topic: string;
    status: 'BACKLOG' | 'ONGOING' | 'COMPLETED' | 'NEEDS_REVISION';
    createdAt: any;
    updatedAt: any;
}

export function useSyllabusData() {
    const { user } = useAuth();
    const [topics, setTopics] = useState<UserTopic[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        if ('isMock' in user && user.isMock) {
            const loadMockData = () => {
                const topicsStr = localStorage.getItem(`jeecommand_mock_topics_${user.uid}`) || '[]';
                setTopics(JSON.parse(topicsStr));
                setLoading(false);
            };
            loadMockData();
            
            const interval = setInterval(loadMockData, 1000); // Polling for mock data sync
            return () => clearInterval(interval);
        }

        const q = query(collection(db, `users/${user.uid}/topics`));
        const unsubscribe = onSnapshot(q, (snap) => {
            const newTopics: UserTopic[] = [];
            snap.forEach(doc => {
                newTopics.push({ id: doc.id, ...doc.data() } as UserTopic);
            });
            // Optional: sort topics
            setTopics(newTopics.sort((a, b) => {
                const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
                const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
                return dateB.getTime() - dateA.getTime();
            }));
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const updateTopicStatus = async (id: string, newStatus: 'BACKLOG' | 'ONGOING' | 'COMPLETED' | 'NEEDS_REVISION') => {
        if (!user) return;
        
        if ('isMock' in user && user.isMock) {
            const topicsStr = localStorage.getItem(`jeecommand_mock_topics_${user.uid}`) || '[]';
            const mockTopics = JSON.parse(topicsStr);
            const updated = mockTopics.map((t: UserTopic) => 
                t.id === id ? { ...t, status: newStatus, updatedAt: new Date().toISOString() } : t
            );
            localStorage.setItem(`jeecommand_mock_topics_${user.uid}`, JSON.stringify(updated));
            return;
        }

        try {
            await updateDoc(doc(db, `users/${user.uid}/topics`, id), {
                status: newStatus,
                updatedAt: serverTimestamp()
            });
        } catch (err) {
            console.error("Failed to update status", err);
        }
    };

    const deleteTopic = async (id: string) => {
         if (!user) return;
        
        if ('isMock' in user && user.isMock) {
            const topicsStr = localStorage.getItem(`jeecommand_mock_topics_${user.uid}`) || '[]';
            const mockTopics = JSON.parse(topicsStr);
            const updated = mockTopics.filter((t: UserTopic) => t.id !== id);
            localStorage.setItem(`jeecommand_mock_topics_${user.uid}`, JSON.stringify(updated));
            return;
        }

        try {
            await deleteDoc(doc(db, `users/${user.uid}/topics`, id));
        } catch (err) {
            console.error("Failed to delete topic", err);
        }
    };

    return { topics, loading, updateTopicStatus, deleteTopic };
}
