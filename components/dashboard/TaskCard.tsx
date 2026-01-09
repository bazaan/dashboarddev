'use client';

import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Briefcase, Calendar, Clock, AlertCircle, Repeat } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface TaskCardProps {
    task: {
        id: string;
        title: string;
        priority: string;
        status: string;
        deadline?: string | Date;
        assignee?: {
            name?: string;
        };
        project?: {
            id: string;
            name: string;
            priority: string;
        };
        recurrenceType?: string;
    };
    onMove?: (taskId: string, newStatus: string) => void;
}

const statusColors = {
    NOT_STARTED: 'bg-slate-50 border-l-4 border-l-slate-400',
    PENDING: 'bg-yellow-50 border-l-4 border-l-yellow-500',
    IN_PROGRESS: 'bg-blue-50 border-l-4 border-l-blue-500',
    DONE: 'bg-green-50 border-l-4 border-l-green-500',
};

const priorityColors = {
    HIGH: 'text-red-600 bg-red-100',
    MEDIUM: 'text-orange-600 bg-orange-100',
    LOW: 'text-green-600 bg-green-100',
};

export function TaskCard({ task, onMove }: TaskCardProps) {
    return (
        <motion.div
            layoutId={task.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}
            className={cn(
                "p-4 rounded-lg shadow-sm border border-slate-200 cursor-move relative transition-colors",
                statusColors[task.status as keyof typeof statusColors] || 'bg-white'
            )}
        >
            <div className="flex justify-between items-start mb-2">
                <span className={cn("text-xs font-bold px-2 py-1 rounded-full", priorityColors[task.priority as keyof typeof priorityColors])}>
                    {task.priority}
                </span>
                {task.deadline && (
                    <div className="flex items-center text-xs text-slate-500">
                        <Clock className="w-3 h-3 mr-1" />
                        {format(new Date(task.deadline), 'MMM d')}
                    </div>
                )}
            </div>

            <h3 className="font-semibold text-slate-900 line-clamp-2 mb-2">{task.title}</h3>

            {task.project && (
                <div className="flex items-center mt-2 mb-2 text-xs text-slate-600">
                    <Briefcase className="w-3 h-3 mr-1" />
                    <span className="truncate">{task.project.name}</span>
                </div>
            )}

            {task.recurrenceType && task.recurrenceType !== 'NONE' && (
                <div className="flex items-center mb-2 text-xs text-slate-500">
                    <Repeat className="w-3 h-3 mr-1" />
                    <span>
                        {task.recurrenceType === 'DAILY' && 'Diaria'}
                        {task.recurrenceType === 'WEEKLY' && 'Semanal'}
                    </span>
                </div>
            )}

            {task.assignee && (
                <div className="flex items-center mt-3 text-xs text-slate-600">
                    <div className="w-5 h-5 rounded-full bg-slate-300 flex items-center justify-center mr-2 text-[10px] font-bold">
                        {task.assignee.name?.[0] || 'U'}
                    </div>
                    <span>{task.assignee.name}</span>
                </div>
            )}

            {/* Quick Actions */}
            <div className="mt-4 flex justify-end gap-2">
                {task.status === 'NOT_STARTED' && (
                    <>
                        <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => onMove?.(task.id, 'PENDING')}>
                            Marcar Pendiente
                        </Button>
                        <Button size="sm" variant="outline" className="h-6 text-xs" onClick={() => onMove?.(task.id, 'IN_PROGRESS')}>
                            Iniciar
                        </Button>
                    </>
                )}
                {(task.status === 'PENDING' || task.status === 'IN_PROGRESS') && (
                    <>
                        <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => onMove?.(task.id, 'IN_PROGRESS')}>
                            En Progreso
                        </Button>
                        <Button size="sm" variant="outline" className="h-6 text-xs" onClick={() => onMove?.(task.id, 'DONE')}>
                            Completar
                        </Button>
                    </>
                )}
                {task.status === 'DONE' && (
                    <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => onMove?.(task.id, 'NOT_STARTED')}>
                        Reiniciar
                    </Button>
                )}
            </div>
        </motion.div>
    );
}
