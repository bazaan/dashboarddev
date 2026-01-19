'use client';

import { useQuery } from '@tanstack/react-query';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isToday } from 'date-fns';
import { useState } from 'react';
import { Calendar, Clock, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TaskCard } from './TaskCard';
import { cn } from '@/lib/utils';
import { Select } from '@/components/ui/select';

type Task = {
    id: string;
    title: string;
    description?: string;
    status: 'NOT_STARTED' | 'PENDING' | 'IN_PROGRESS' | 'DONE';
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    deadline?: string;
    cadence?: 'DAILY' | 'WEEKLY';
    recurrenceType?: 'NONE' | 'DAILY' | 'WEEKLY';
    assigneeId?: string | null;
    assignee?: { name: string; email?: string | null };
    project?: { id: string; name: string; priority: string };
};

type UserOption = {
    id: string;
    name?: string | null;
    email: string;
};

export function DailyWeeklyTasks() {
    const [view, setView] = useState<'daily' | 'weekly'>('daily');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [assigneeFilter, setAssigneeFilter] = useState<string>('all');

    const { data: users } = useQuery<UserOption[]>({
        queryKey: ['users'],
        queryFn: async () => {
            const res = await fetch('/api/users');
            if (!res.ok) throw new Error('Failed to fetch users');
            return res.json();
        },
    });

    const { data: tasks, isLoading } = useQuery<Task[]>({
        queryKey: ['tasks', view, format(selectedDate, 'yyyy-MM-dd'), assigneeFilter],
        queryFn: async () => {
            const params = new URLSearchParams({
                type: view,
                date: format(selectedDate, 'yyyy-MM-dd'),
            });
            if (assigneeFilter !== 'all') {
                params.set('assigneeId', assigneeFilter);
            }
            const res = await fetch(`/api/tasks?${params.toString()}`);
            if (!res.ok) throw new Error('Failed to fetch tasks');
            return res.json();
        },
    });

    const navigateDate = (direction: 'prev' | 'next') => {
        if (view === 'daily') {
            const newDate = new Date(selectedDate);
            newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
            setSelectedDate(newDate);
        } else {
            const newDate = new Date(selectedDate);
            newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
            setSelectedDate(newDate);
        }
    };

    const weekDays = view === 'weekly' ? eachDayOfInterval({
        start: startOfWeek(selectedDate),
        end: endOfWeek(selectedDate),
    }) : [selectedDate];

    const getTasksForDay = (day: Date) => {
        if (!tasks) return [];
        return tasks.filter((task) => {
            if (task.cadence === 'DAILY') return true;
            if (task.cadence === 'WEEKLY' && task.deadline) {
                const taskDate = new Date(task.deadline);
                return taskDate.toDateString() === day.toDateString();
            }
            if (task.recurrenceType === 'DAILY') return true;
            if (task.recurrenceType === 'WEEKLY' && task.deadline) {
                const taskDate = new Date(task.deadline);
                return taskDate.toDateString() === day.toDateString();
            }
            if (task.deadline) {
                const taskDate = new Date(task.deadline);
                return isSameDay(taskDate, day);
            }
            return false;
        });
    };

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header con navegación */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex gap-2">
                        <Button
                            variant={view === 'daily' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setView('daily')}
                        >
                            <Clock className="w-4 h-4 mr-2" />
                            Diario
                        </Button>
                        <Button
                            variant={view === 'weekly' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setView('weekly')}
                        >
                            <Calendar className="w-4 h-4 mr-2" />
                            Semanal
                        </Button>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => navigateDate('prev')}>
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <span className="text-sm font-semibold text-slate-700 min-w-[200px] text-center">
                            {view === 'daily'
                                ? format(selectedDate, 'EEEE, d MMMM yyyy')
                                : `${format(startOfWeek(selectedDate), 'd MMM')} - ${format(endOfWeek(selectedDate), 'd MMM yyyy')}`}
                        </span>
                        <Button variant="outline" size="sm" onClick={() => navigateDate('next')}>
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setSelectedDate(new Date())}>
                            Hoy
                        </Button>
                    </div>
                </div>
                <div className="w-64">
                    <Select value={assigneeFilter} onChange={(event) => setAssigneeFilter(event.target.value)}>
                        <option value="all">Todas las tareas</option>
                        <option value="me">Mis tareas</option>
                        {(users || []).map((user) => (
                            <option key={user.id} value={user.id}>
                                {user.name || user.email}
                            </option>
                        ))}
                    </Select>
                </div>
            </div>

            {/* Vista de tareas */}
            {view === 'daily' ? (
                <div className="space-y-4">
                    <div className="alef-card p-4">
                        <h3 className="text-lg font-semibold mb-4">
                            {format(selectedDate, 'EEEE, d MMMM yyyy')}
                            {isToday(selectedDate) && (
                                <Badge className="ml-2 bg-blue-100 text-blue-800">Hoy</Badge>
                            )}
                        </h3>
                        <div className="space-y-3">
                            {getTasksForDay(selectedDate).length > 0 ? (
                                getTasksForDay(selectedDate).map((task) => (
                                    <TaskCard key={task.id} task={task} />
                                ))
                            ) : (
                                <div className="text-center py-8 text-slate-500">
                                    No hay tareas para este día
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-7 gap-4">
                    {weekDays.map((day, idx) => {
                        const dayTasks = getTasksForDay(day);
                        const isCurrentDay = isToday(day);

                        return (
                            <div
                                key={idx}
                                className={cn(
                                    'bg-white/95 rounded-lg border border-blue-100 p-3 min-h-[300px] shadow-sm shadow-blue-100/40',
                                    isCurrentDay && 'border-blue-500 border-2'
                                )}
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <span
                                        className={cn(
                                            'text-sm font-semibold',
                                            isCurrentDay && 'text-blue-600'
                                        )}
                                    >
                                        {format(day, 'EEE')}
                                    </span>
                                    <span
                                        className={cn(
                                            'text-xs',
                                            isCurrentDay && 'text-blue-600 font-semibold'
                                        )}
                                    >
                                        {format(day, 'd')}
                                    </span>
                                </div>
                                <div className="space-y-2">
                                    {dayTasks.length > 0 ? (
                                        dayTasks.map((task) => (
                                            <TaskCard key={task.id} task={task} />
                                        ))
                                    ) : (
                                        <div className="text-xs text-slate-400 text-center py-4">
                                            Sin tareas
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
