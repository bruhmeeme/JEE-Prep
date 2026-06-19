import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Select } from '../ui/Select';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp, query, getDocs, where } from 'firebase/firestore';
import { format } from 'date-fns';

interface LogStudyModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function LogStudyModal({ isOpen, onClose }: LogStudyModalProps) {
    const { user } = useAuth();
    const [subject, setSubject] = useState<'physics' | 'chemistry' | 'maths'>('physics');
    const [duration, setDuration] = useState<string>('');
    const [dateStr, setDateStr] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
    const [planItem, setPlanItem] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [planItems, setPlanItems] = useState<{id: string, topic: string, subject: string}[]>([]);

    useEffect(() => {
        if (!isOpen || !user) return;

        const loadTodaysPlan = async () => {
            if ('isMock' in user && user.isMock) {
                const dateParams = format(new Date(), 'yyyy-MM-dd');
                const itemsStr = localStorage.getItem(`jeecommand_mock_planItems_${user.uid}`) || '[]';
                const items = JSON.parse(itemsStr).filter((i: any) => i.dateStr === dateParams);
                setPlanItems(items);
                return;
            }

            const dateParams = format(new Date(), 'yyyy-MM-dd');
            const q = query(
                collection(db, `users/${user.uid}/planItems`),
                where("dateStr", "==", dateParams)
            );
            try {
                const snap = await getDocs(q);
                const items: any[] = [];
                snap.forEach(doc => {
                    const data = doc.data();
                    items.push({ id: doc.id, topic: data.topic, subject: data.subject });
                });
                setPlanItems(items);
            } catch (err) {
                console.error("Failed to load plan items", err);
            }
        };

        loadTodaysPlan();
    }, [isOpen, user]);

    const handleQuickAdd = (mins: number) => {
        const current = parseInt(duration || '0', 10);
        setDuration((current + mins).toString());
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const durationMins = parseInt(duration, 10);
        if (!user || isNaN(durationMins) || durationMins <= 0) {
            setError("Please enter a valid duration greater than 0.");
            return;
        }

        setError(null);
        setLoading(true);

        const dateObj = new Date(dateStr + 'T12:00:00'); // ensure it lands on the day

        const logData = {
            subject,
            durationMinutes: durationMins,
            date: dateObj,
            linkedPlanItemId: planItem || null,
            createdAt: serverTimestamp()
        };

        if ('isMock' in user && user.isMock) {
            const logsStr = localStorage.getItem(`jeecommand_mock_logs_${user.uid}`) || '[]';
            const logs = JSON.parse(logsStr);
            logs.push({ ...logData, id: Math.random().toString(), date: logData.date.toISOString(), createdAt: new Date().toISOString() });
            localStorage.setItem(`jeecommand_mock_logs_${user.uid}`, JSON.stringify(logs));
            setLoading(false);
            setDuration(''); // reset
            onClose();
            return;
        }

        try {
            await addDoc(collection(db, `users/${user.uid}/studyLogs`), logData);
            setDuration(''); // clean for next open
            onClose();
        } catch (err) {
            console.error("Failed to add study log", err);
            setError("Failed to save study log. Please check your connection.");
        } finally {
            setLoading(false);
        }
    };

    const availablePlans = planItems.filter(p => !subject || p.subject === subject);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Log Study Time">
            <form onSubmit={handleSave} className="space-y-4">
                {error && <div className="text-red-400 text-sm bg-red-400/10 p-2 rounded border border-red-400/20">{error}</div>}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="date">Date</Label>
                        <Input 
                            id="date" 
                            type="date" 
                            value={dateStr}
                            onChange={(e) => setDateStr(e.target.value)}
                            required 
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="subject">Subject</Label>
                        <Select 
                            id="subject"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value as any)}
                        >
                            <option value="physics">Physics</option>
                            <option value="chemistry">Chemistry</option>
                            <option value="maths">Maths</option>
                        </Select>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="planItem">Link to today's goal (optional)</Label>
                    <Select 
                        id="planItem"
                        value={planItem}
                        onChange={(e) => setPlanItem(e.target.value)}
                    >
                        <option value="">No specific goal</option>
                        {availablePlans.map(p => (
                            <option key={p.id} value={p.id}>{p.topic}</option>
                        ))}
                    </Select>
                </div>

                <div className="space-y-3">
                    <Label htmlFor="duration">Duration (minutes)</Label>
                    <div className="flex gap-2">
                        <Input 
                            id="duration" 
                            type="number" 
                            min="1"
                            placeholder="e.g. 45"
                            value={duration}
                            onChange={(e) => setDuration(e.target.value)}
                            required 
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button type="button" variant="secondary" size="sm" onClick={() => handleQuickAdd(15)}>+15m</Button>
                        <Button type="button" variant="secondary" size="sm" onClick={() => handleQuickAdd(30)}>+30m</Button>
                        <Button type="button" variant="secondary" size="sm" onClick={() => handleQuickAdd(60)}>+60m</Button>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>Cancel</Button>
                    <Button type="submit" variant="primary" disabled={loading}>
                        {loading ? 'Saving...' : 'Save Log'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
