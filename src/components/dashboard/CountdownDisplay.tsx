import React, { useState, useEffect } from 'react';
import { differenceInDays, startOfDay, format } from 'date-fns';
import { Edit2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';

export function CountdownDisplay() {
    const { user } = useAuth();
    const [examDate, setExamDate] = useState<Date | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    
    // Edit form state
    const [editDateStr, setEditDateStr] = useState('');

    useEffect(() => {
        if (!user) return;

        const loadData = async () => {
            setLoading(true);
            if ('isMock' in user && user.isMock) {
                const mockDataStr = localStorage.getItem(`jeecommand_mock_data_${user.uid}`);
                const mockData = mockDataStr ? JSON.parse(mockDataStr) : null;
                if (mockData && mockData.examDate) {
                    setExamDate(new Date(mockData.examDate));
                } else {
                     const defaultDate = new Date();
                     defaultDate.setFullYear(defaultDate.getFullYear() + 1);
                     setExamDate(defaultDate);
                }
                setLoading(false);
                return;
            }

            try {
                const docRef = doc(db, "users", user.uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists() && docSnap.data().examDate) {
                    setExamDate(docSnap.data().examDate.toDate());
                } else {
                     const defaultDate = new Date();
                     defaultDate.setFullYear(defaultDate.getFullYear() + 1);
                     setExamDate(defaultDate);
                }
            } catch (err) {
                console.error("Failed to load exam date", err);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [user]);

    const handleOpenEdit = () => {
        if (examDate) {
            setEditDateStr(format(examDate, 'yyyy-MM-dd'));
        }
        setIsEditing(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !editDateStr) return;

        const newDate = new Date(editDateStr);
        setExamDate(newDate);
        setIsEditing(false);

        if ('isMock' in user && user.isMock) {
            localStorage.setItem(`jeecommand_mock_data_${user.uid}`, JSON.stringify({ examDate: newDate.toISOString() }));
            return;
        }

        try {
            await setDoc(doc(db, "users", user.uid), { examDate: newDate }, { merge: true });
        } catch (err) {
            console.error("Failed to save exam date", err);
        }
    };

    if (loading) {
        return <div className="h-24 animate-pulse bg-border-subtle rounded-md"></div>;
    }

    if (!examDate) return null;

    const days = differenceInDays(startOfDay(examDate), startOfDay(new Date()));
    const validDays = isNaN(days) ? 0 : days;
    const isPast = validDays < 0;
    const isToday = validDays === 0;

    return (
        <>
            <div className="group relative transition-all">
                <div className="flex justify-between items-start">
                    <div 
                        className="text-6xl md:text-[5rem] leading-none font-bold text-gray-100 tracking-tighter"
                        style={{ fontVariantNumeric: 'tabular-nums' }}
                    >
                        {isPast ? Math.abs(validDays) : isToday ? "0" : validDays}
                    </div>
                    <button 
                        onClick={handleOpenEdit} 
                        className="text-gray-500 hover:text-brand transition-colors p-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 focus:opacity-100"
                        title="Edit Exam Date"
                    >
                        <Edit2 className="w-4 h-4" />
                    </button>
                </div>
                <div className="text-xs font-semibold tracking-widest text-brand mt-2 uppercase">
                    {isPast ? "Days Since Exam" : isToday ? "Exam Day!" : "Days to Exam"}
                </div>
            </div>

            <Modal isOpen={isEditing} onClose={() => setIsEditing(false)} title="Set Exam Date">
                <form onSubmit={handleSave} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="examDate">Target Exam Date</Label>
                        <Input
                            id="examDate"
                            type="date"
                            value={editDateStr}
                            onChange={(e) => setEditDateStr(e.target.value)}
                            required
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                        <Button type="submit" variant="primary">Save Changes</Button>
                    </div>
                </form>
            </Modal>
        </>
    );
}
