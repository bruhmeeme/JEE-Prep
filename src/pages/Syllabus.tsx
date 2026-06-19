import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Plus, X, Trash2, BookOpen } from 'lucide-react';
import { useSyllabusData, UserTopic } from '../hooks/useSyllabusData';
import { TopicModal } from '../components/syllabus/TopicModal';
import { SUBJECT_COLORS, Subject } from '../data/jeeSyllabus';
import { cn } from '../lib/utils';
import { Select } from '../components/ui/Select';

const STATUS_CONFIG = {
    BACKLOG: { label: 'Backlog', color: 'text-red-400 bg-red-400/10 border-red-400/20 hover:bg-red-400/20' },
    ONGOING: { label: 'Ongoing', color: 'text-blue-400 bg-blue-400/10 border-blue-400/20 hover:bg-blue-400/20' },
    COMPLETED: { label: 'Completed', color: 'text-green-400 bg-green-400/10 border-green-400/20 hover:bg-green-400/20' },
    NEEDS_REVISION: { label: 'Needs Revision', color: 'text-amber-400 bg-amber-400/10 border-amber-400/20 hover:bg-amber-400/20' },
};

interface TopicRowProps {
    topic: UserTopic;
    onUpdateStatus: (id: string, s: any) => Promise<void> | void;
    onDelete: (id: string) => Promise<void> | void;
    key?: React.Key;
}

function TopicRow({ topic, onUpdateStatus, onDelete }: TopicRowProps) {
    const [confirmDelete, setConfirmDelete] = useState(false);

    const actions = (
        <>
            <div className="relative">
                <select
                    value={topic.status}
                    onChange={(e) => onUpdateStatus(topic.id, e.target.value)}
                    className={cn(
                        "appearance-none px-3 py-1 pr-8 text-xs font-medium rounded-full border focus:outline-none cursor-pointer transition-colors outline-none",
                        STATUS_CONFIG[topic.status as keyof typeof STATUS_CONFIG].color
                    )}
                    style={{ WebkitAppearance: 'none' }}
                >
                    <option value="BACKLOG">Backlog</option>
                    <option value="ONGOING">Ongoing</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="NEEDS_REVISION">Needs Revision</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <svg className="w-3 h-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
            </div>

            {confirmDelete ? (
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => onDelete(topic.id)}
                        className="text-xs text-red-400 hover:text-red-300 font-medium"
                    >
                        Confirm
                    </button>
                    <button 
                        onClick={() => setConfirmDelete(false)}
                        className="text-xs text-gray-400 hover:text-gray-300"
                    >
                        Cancel
                    </button>
                </div>
            ) : (
                <button 
                    onClick={() => setConfirmDelete(true)}
                    className="text-gray-500 hover:text-red-400 lg:opacity-0 md:opacity-0 group-hover:opacity-100 transition-opacity p-1"
                    aria-label="Delete topic"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            )}
        </>
    );

    return (
        <div className="flex flex-col md:flex-row p-4 gap-3 md:gap-4 bg-bg-card rounded-lg border border-border-subtle group hover:border-gray-700 md:items-center transition-colors">
            <div className="flex items-center justify-between md:justify-start gap-4 md:w-32 shrink-0">
                <div className="flex items-center gap-2 shrink-0">
                    <span 
                        className="w-2.5 h-2.5 rounded-full shrink-0" 
                        style={{ backgroundColor: SUBJECT_COLORS[topic.subject as keyof typeof SUBJECT_COLORS] }} 
                    />
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        {topic.subject}
                    </span>
                </div>
                
                {/* Mobile Actions */}
                <div className="flex items-center gap-3 md:hidden shrink-0">
                    {actions}
                </div>
            </div>
            
            <span className="text-sm font-medium text-gray-200 flex-1">{topic.topic}</span>
            
            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-4 shrink-0 justify-end">
                {actions}
            </div>
        </div>
    );
}

export function Syllabus() {
    const { topics, loading, updateTopicStatus, deleteTopic } = useSyllabusData();
    const [filter, setFilter] = useState<'all' | Subject>('all');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const filteredTopics = topics.filter(t => filter === 'all' || t.subject === filter);

    const FilterButton = ({ value, label }: { value: 'all' | Subject, label: string }) => (
        <button
            onClick={() => setFilter(value)}
            className={cn(
                "px-4 py-1.5 text-sm font-medium transition-all rounded-md",
                filter === value 
                    ? "bg-brand text-white shadow-sm" 
                    : "text-gray-400 hover:text-gray-200 hover:bg-bg-base/50"
            )}
        >
            {label}
        </button>
    );

    return (
        <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 md:mb-8">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-100 tracking-tight">Syllabus</h1>
                    <p className="text-gray-400 mt-2">Track subject topics and completion status.</p>
                </div>
                <Button onClick={() => setIsAddModalOpen(true)} className="w-full md:w-auto shadow-lg shadow-brand/20">
                    <Plus className="w-4 h-4 mr-2" /> Add Topic
                </Button>
            </header>

            <div className="mb-6 flex overflow-x-auto scrollbar-hide py-1">
                <div className="flex p-1 bg-bg-card border border-border-subtle rounded-lg gap-1 min-w-max">
                    <FilterButton value="all" label="All Subjects" />
                    <FilterButton value="physics" label="Physics" />
                    <FilterButton value="chemistry" label="Chemistry" />
                    <FilterButton value="maths" label="Maths" />
                </div>
            </div>

            <div className="bg-bg-card rounded-xl border border-border-subtle shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 md:p-6 space-y-3">
                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-16 bg-bg-base animate-pulse rounded-lg border border-border-subtle"></div>
                            ))}
                        </div>
                    ) : filteredTopics.length === 0 ? (
                        <div className="py-12 text-center flex flex-col items-center">
                            <div className="w-12 h-12 rounded-full bg-bg-base flex items-center justify-center mb-3 border border-border-subtle">
                                <BookOpen className="w-6 h-6 text-gray-500" />
                            </div>
                            <h3 className="text-gray-200 font-medium tracking-tight">No topics found</h3>
                            <p className="text-gray-400 text-sm mt-1 mb-4 max-w-xs">
                                {filter === 'all' 
                                    ? "You haven't added any topics to track yet."
                                    : `You haven't added any ${filter} topics yet.`}
                            </p>
                            <Button onClick={() => setIsAddModalOpen(true)} variant="outline" size="sm">
                                <Plus className="w-4 h-4 mr-2" /> Add Topic
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredTopics.map(t => (
                                <TopicRow 
                                    key={t.id} 
                                    topic={t} 
                                    onUpdateStatus={updateTopicStatus} 
                                    onDelete={deleteTopic} 
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <TopicModal 
                isOpen={isAddModalOpen} 
                onClose={() => setIsAddModalOpen(false)} 
                existingTopics={topics} 
            />
        </div>
    );
}
