import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Label } from '../ui/Label';
import { Test, TestSyllabusEntry } from '../../hooks/useTestsData';
import { Subject } from '../../data/jeeSyllabus';
import { Plus, Trash2 } from 'lucide-react';

interface TestModalProps {
    isOpen: boolean;
    onClose: () => void;
    test: Test | null;
    onSave: (test: Omit<Test, 'id' | 'createdAt'> & { id?: string }) => Promise<void>;
}

export function TestModal({ isOpen, onClose, test, onSave }: TestModalProps) {
    const [name, setName] = useState('');
    const [dateStr, setDateStr] = useState('');
    const [preparedness, setPreparedness] = useState(50);
    const [marksObtained, setMarksObtained] = useState('');
    const [totalMarks, setTotalMarks] = useState('');
    const [syllabus, setSyllabus] = useState<TestSyllabusEntry[]>([{ subject: 'physics', topics: '' }]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            if (test) {
                setName(test.name);
                setDateStr(test.dateStr);
                setPreparedness(test.preparedness || 0);
                setMarksObtained(test.marksObtained?.toString() || '');
                setTotalMarks(test.totalMarks?.toString() || '');
                setSyllabus(test.syllabus && test.syllabus.length > 0 ? test.syllabus : [{ subject: 'physics', topics: '' }]);
            } else {
                setName('');
                setDateStr('');
                setPreparedness(50);
                setMarksObtained('');
                setTotalMarks('');
                setSyllabus([{ subject: 'physics', topics: '' }]);
            }
        }
    }, [isOpen, test]);

    const handleAddSubject = () => {
        if (syllabus.length < 3) {
            setSyllabus([...syllabus, { subject: 'chemistry', topics: '' }]);
        }
    };

    const handleRemoveSubject = (index: number) => {
        setSyllabus(syllabus.filter((_, i) => i !== index));
    };

    const handleSyllabusChange = (index: number, field: keyof TestSyllabusEntry, value: string) => {
        const newSyllabus = [...syllabus];
        newSyllabus[index] = { ...newSyllabus[index], [field]: value };
        setSyllabus(newSyllabus);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !dateStr) {
            setError("Name and Date are required.");
            return;
        }

        setError(null);
        setSaving(true);
        try {
            await onSave({
                id: test?.id,
                name,
                dateStr,
                preparedness,
                syllabus: syllabus.filter(s => s.topics.trim() !== ''),
                ...(marksObtained && { marksObtained: Number(marksObtained) }),
                ...(totalMarks && { totalMarks: Number(totalMarks) })
            });
            onClose();
        } catch (err) {
            console.error("Failed to save test", err);
            setError("Failed to save test. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={test ? "Edit Test" : "Add New Test"}>
            <form onSubmit={handleSave} className="space-y-4">
                {error && <div className="text-red-400 text-sm bg-red-400/10 p-2 rounded border border-red-400/20">{error}</div>}
                <div className="space-y-2">
                    <Label htmlFor="name">Test Name</Label>
                    <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. AITS Part Test 1" required />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="dateStr">Date</Label>
                        <Input id="dateStr" type="date" value={dateStr} onChange={e => setDateStr(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="preparedness">Preparedness ({preparedness}%)</Label>
                        <input 
                            id="preparedness" 
                            type="range" 
                            min="0" 
                            max="100" 
                            value={preparedness} 
                            onChange={e => setPreparedness(parseInt(e.target.value, 10))} 
                            className="w-full accent-brand py-2"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="marksObtained">Marks Obtained (Optional)</Label>
                        <Input id="marksObtained" type="number" value={marksObtained} onChange={e => setMarksObtained(e.target.value)} placeholder="e.g. 180" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="totalMarks">Total Marks (Optional)</Label>
                        <Input id="totalMarks" type="number" value={totalMarks} onChange={e => setTotalMarks(e.target.value)} placeholder="e.g. 300" />
                    </div>
                </div>

                <div className="space-y-3 pt-2">
                    <Label>Syllabus Covered</Label>
                    {syllabus.map((entry, index) => (
                        <div key={index} className="flex gap-2 items-start bg-bg-base/50 p-3 rounded-lg border border-border-subtle relative group">
                            <div className="flex-1 space-y-2">
                                <Select 
                                    value={entry.subject} 
                                    onChange={e => handleSyllabusChange(index, 'subject', e.target.value)}
                                >
                                    <option value="physics">Physics</option>
                                    <option value="chemistry">Chemistry</option>
                                    <option value="maths">Maths</option>
                                </Select>
                                <Input 
                                    value={entry.topics} 
                                    onChange={e => handleSyllabusChange(index, 'topics', e.target.value)}
                                    placeholder="Topics (e.g. Kinematics, Mole Concept)"
                                />
                            </div>
                            {syllabus.length > 1 && (
                                <button 
                                    type="button" 
                                    onClick={() => handleRemoveSubject(index)}
                                    className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    ))}
                    {syllabus.length < 3 && (
                        <Button type="button" variant="ghost" size="sm" onClick={handleAddSubject} className="border border-dashed border-border-subtle w-full">
                            <Plus className="w-4 h-4 mr-2" /> Add another subject
                        </Button>
                    )}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-border-subtle">
                    <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
                    <Button type="submit" variant="primary" disabled={saving || !name || !dateStr}>
                        {saving ? 'Saving...' : (test ? 'Update Test' : 'Add Test')}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
