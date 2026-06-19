import React, { useState, useMemo } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { Label } from '../ui/Label';
import { SearchableSelect } from '../ui/SearchableSelect';
import { JEE_SYLLABUS, Subject } from '../../data/jeeSyllabus';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface TopicModalProps {
    isOpen: boolean;
    onClose: () => void;
    existingTopics: { subject: Subject; topic: string }[];
}

export function TopicModal({ isOpen, onClose, existingTopics }: TopicModalProps) {
    const { user } = useAuth();
    const [subject, setSubject] = useState<Subject>('physics');
    const [topic, setTopic] = useState('');
    const [status, setStatus] = useState('BACKLOG');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const topicOptions = useMemo(() => {
        const allTopicsForSubject = JEE_SYLLABUS[subject] || [];
        const existingForSubject = new Set(
            existingTopics.filter(t => t.subject === subject).map(t => t.topic)
        );
        return allTopicsForSubject
            .filter(t => !existingForSubject.has(t))
            .map(t => ({ value: t, label: t }));
    }, [subject, existingTopics]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        
        if (!topic) {
            setError("Please select a topic.");
            return;
        }

        setError(null);
        setLoading(true);

        const topicData = {
            subject,
            topic,
            status,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        if ('isMock' in user && user.isMock) {
            const mockTopicsStr = localStorage.getItem(`jeecommand_mock_topics_${user.uid}`) || '[]';
            const mockTopics = JSON.parse(mockTopicsStr);
            mockTopics.push({ 
                ...topicData, 
                id: Math.random().toString(), 
                createdAt: new Date().toISOString(), 
                updatedAt: new Date().toISOString() 
            });
            localStorage.setItem(`jeecommand_mock_topics_${user.uid}`, JSON.stringify(mockTopics));
            setLoading(false);
            setTopic('');
            onClose();
            return;
        }

        try {
            await addDoc(collection(db, `users/${user.uid}/topics`), topicData);
            setTopic('');
            onClose();
        } catch (err) {
            console.error("Failed to add topic", err);
            setError("Failed to save topic. Please check your connection.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add New Topic">
            <form onSubmit={handleSave} className="space-y-4">
                {error && <div className="text-red-400 text-sm bg-red-400/10 p-2 rounded border border-red-400/20">{error}</div>}
                <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Select 
                        id="subject"
                        value={subject}
                        onChange={(e) => {
                            setSubject(e.target.value as Subject);
                            setTopic(''); // Reset topic when subject changes
                        }}
                    >
                        <option value="physics">Physics</option>
                        <option value="chemistry">Chemistry</option>
                        <option value="maths">Maths</option>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label>Topic</Label>
                    <SearchableSelect 
                        options={topicOptions}
                        value={topic}
                        onChange={setTopic}
                        placeholder={topicOptions.length === 0 ? "All topics added!" : "Search for a topic..."}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select 
                        id="status"
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                    >
                        <option value="BACKLOG">Backlog</option>
                        <option value="ONGOING">Ongoing</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="NEEDS_REVISION">Needs Revision</option>
                    </Select>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>Cancel</Button>
                    <Button type="submit" variant="primary" disabled={loading || !topic}>
                        {loading ? 'Adding...' : 'Add Topic'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
