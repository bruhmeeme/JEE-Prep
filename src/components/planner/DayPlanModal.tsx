import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { PlanItem } from '../../hooks/usePlannerData';
import { Subject, SUBJECT_COLORS } from '../../data/jeeSyllabus';
import { format } from 'date-fns';
import { Trash2, Edit2, Plus, GripVertical } from 'lucide-react';

interface DayPlanModalProps {
    isOpen: boolean;
    onClose: () => void;
    date: Date | null;
    existingItems: PlanItem[];
    onSave: (dateStr: string, itemsToSave: Omit<PlanItem, 'id' | 'createdAt' | 'completed' | 'dateStr'>[], itemsToRemove: string[]) => Promise<void>;
}

export function DayPlanModal({ isOpen, onClose, date, existingItems, onSave }: DayPlanModalProps) {
    const [workingItems, setWorkingItems] = useState<(Omit<PlanItem, 'createdAt' | 'completed' | 'dateStr'> & { isNew?: boolean })[]>([]);
    const [removedIds, setRemovedIds] = useState<string[]>([]);
    
    // Add form state
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [subject, setSubject] = useState<Subject>('physics');
    const [topic, setTopic] = useState('');
    const [questions, setQuestions] = useState('');
    const [time, setTime] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [lastOpenedDate, setLastOpenedDate] = useState<string | null>(null);

    useEffect(() => {
        const currentDateStr = date ? date.getTime().toString() : null;
        
        if (isOpen && currentDateStr !== lastOpenedDate) {
            setWorkingItems(existingItems.map(i => ({ ...i })));
            setRemovedIds([]);
            setIsAdding(existingItems.length === 0);
            setEditingId(null);
            setSubject('physics');
            setTopic('');
            setQuestions('');
            setTime('');
            setLastOpenedDate(currentDateStr);
        } else if (!isOpen && lastOpenedDate !== null) {
            setLastOpenedDate(null);
        }
    }, [isOpen, date, existingItems, lastOpenedDate]);

    const handleSaveItem = () => {
        if (!topic || !questions || !time) return;
        
        if (editingId) {
            setWorkingItems(workingItems.map(item => 
                item.id === editingId ? {
                    ...item,
                    subject,
                    topic,
                    questionsGoal: parseInt(questions, 10),
                    timeAllocationMinutes: parseInt(time, 10)
                } : item
            ));
            setEditingId(null);
        } else {
            const newItem = {
                id: `temp-${Date.now()}`,
                subject,
                topic,
                questionsGoal: parseInt(questions, 10),
                timeAllocationMinutes: parseInt(time, 10),
                isNew: true
            };
            setWorkingItems([...workingItems, newItem]);
        }
        
        setTopic('');
        setQuestions('');
        setTime('');
        setIsAdding(false);
    };

    const handleEditItem = (item: any) => {
        setSubject(item.subject);
        setTopic(item.topic);
        setQuestions(item.questionsGoal.toString());
        setTime(item.timeAllocationMinutes.toString());
        setEditingId(item.id);
        setIsAdding(true);
    };

    const handleRemove = (id: string, isNew?: boolean) => {
        setWorkingItems(workingItems.filter(i => i.id !== id));
        if (!isNew) {
            setRemovedIds([...removedIds, id]);
        }
    };

    const handleConfirm = async () => {
        if (!date) return;
        setError(null);
        setSaving(true);
        const dateStr = format(date, 'yyyy-MM-dd');
        
        try {
            await onSave(dateStr, workingItems.map(i => ({
                 id: i.id.startsWith('temp-') ? undefined : i.id, // we might need to tell backend it's existing
                 subject: i.subject,
                 topic: i.topic,
                 questionsGoal: i.questionsGoal,
                 timeAllocationMinutes: i.timeAllocationMinutes,
            })) as any, removedIds);
            onClose();
        } catch (e) {
            console.error(e);
            setError("Failed to save plan. Please check your connection.");
        } finally {
            setSaving(false);
        }
    };

    if (!date) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Plan for ${format(date, 'MMMM d, yyyy')}`}>
            <div className="space-y-6">
                {error && <div className="text-red-400 text-sm bg-red-400/10 p-2 rounded border border-red-400/20">{error}</div>}
                
                {/* Working List */}
                <div className="space-y-3">
                    {workingItems.map((item, index) => (
                        <div key={item.id} className={`flex items-center gap-3 p-3 bg-bg-base border rounded-lg transition-colors ${editingId === item.id ? 'border-brand ring-1 ring-brand/30' : 'border-border-subtle'}`}>
                            <GripVertical className="w-4 h-4 text-gray-600 cursor-grab" />
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: SUBJECT_COLORS[item.subject] }} />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-200">{item.topic}</p>
                                <p className="text-xs text-gray-500">
                                    {item.questionsGoal} Qs • {item.timeAllocationMinutes}m
                                </p>
                            </div>
                            <button 
                                onClick={() => handleEditItem(item)}
                                className="p-1.5 text-gray-500 hover:text-brand hover:bg-brand/10 rounded transition-colors"
                            >
                                <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                                onClick={() => handleRemove(item.id, item.isNew)}
                                className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                    {workingItems.length === 0 && !isAdding && (
                        <p className="text-sm text-gray-500 text-center py-4">No specific plan for this day yet.</p>
                    )}
                </div>

                {/* Add New Inline Form */}
                {isAdding ? (
                    <div className={`p-4 bg-bg-base/50 border rounded-lg space-y-4 ${editingId ? 'border-brand border-dashed' : 'border-border-subtle'}`}>
                        <h4 className="text-sm font-medium text-gray-300 flex items-center gap-2">
                           {editingId ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />} 
                           {editingId ? 'Edit Task' : 'Add Task'}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Select value={subject} onChange={(e) => setSubject(e.target.value as Subject)}>
                                <option value="physics">Physics</option>
                                <option value="chemistry">Chemistry</option>
                                <option value="maths">Maths</option>
                            </Select>
                            <Input 
                                placeholder="Topic to cover (e.g. Kinematics PYQs)" 
                                value={topic} 
                                onChange={(e) => setTopic(e.target.value)} 
                            />
                            <Input 
                                type="number" 
                                placeholder="Target Questions" 
                                value={questions} 
                                onChange={(e) => setQuestions(e.target.value)} 
                            />
                            <Input 
                                type="number" 
                                placeholder="Time allocated (mins)" 
                                value={time} 
                                onChange={(e) => setTime(e.target.value)} 
                            />
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                             {(workingItems.length > 0 || editingId) && (
                                <Button type="button" variant="ghost" size="sm" onClick={() => { setIsAdding(false); setEditingId(null); }}>
                                    Cancel
                                </Button>
                             )}
                            <Button type="button" variant="secondary" size="sm" onClick={handleSaveItem}>
                                {editingId ? 'Save Changes' : 'Add to List'}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <Button type="button" variant="ghost" className="w-full border border-dashed border-border-subtle hover:border-gray-500" onClick={() => setIsAdding(true)}>
                        <Plus className="w-4 h-4 mr-2" /> Add Plan Item
                    </Button>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-border-subtle">
                    <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
                    <Button type="button" variant="primary" onClick={handleConfirm} disabled={saving}>
                        {saving ? 'Saving...' : 'Confirm Plan'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
