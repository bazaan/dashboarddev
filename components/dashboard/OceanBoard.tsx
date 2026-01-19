'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TaskCard } from './TaskCard';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Select } from '@/components/ui/select';

type Task = {
    id: string;
    title: string;
    status: 'NOT_STARTED' | 'PENDING' | 'IN_PROGRESS' | 'DONE';
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    deadline?: string;
    assigneeId?: string | null;
    assignee?: { name: string; email?: string | null };
    project?: { id: string; name: string; priority: string };
};

type UserOption = {
    id: string;
    name?: string | null;
    email: string;
};

export function OceanBoard() {
    const queryClient = useQueryClient();
    const [assigneeFilter, setAssigneeFilter] = useState<string>('all');

    const { data: users } = useQuery<UserOption[]>({
        queryKey: ['users'],
        queryFn: async () => {
            const res = await fetch('/api/users');
            if (!res.ok) throw new Error('Failed to fetch users');
            return res.json();
        },
    });
    const { data: tasks, isLoading, error } = useQuery({
        queryKey: ['tasks', assigneeFilter],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (assigneeFilter !== 'all') {
                params.set('assigneeId', assigneeFilter);
            }
            const res = await fetch(`/api/tasks${params.toString() ? `?${params.toString()}` : ''}`);
            if (!res.ok) throw new Error('Failed to fetch tasks');
            return res.json();
        }
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, status }: { id: string, status: string }) => {
            const res = await fetch(`/api/tasks/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to update task');
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
        }
    });

    if (isLoading) return <div className="flex h-64 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;
    if (error) return <div className="text-red-500">Error loading tasks</div>;

    // Clasificación: Sin Iniciar, Pendientes, Acabados
    const columns = {
        NOT_STARTED: tasks?.filter((t: Task) => t.status === 'NOT_STARTED') || [],
        PENDING: tasks?.filter((t: Task) => t.status === 'PENDING' || t.status === 'IN_PROGRESS') || [],
        DONE: tasks?.filter((t: Task) => t.status === 'DONE') || [],
    };

    const columnLabels = {
        NOT_STARTED: 'Sin Iniciar',
        PENDING: 'Pendientes',
        DONE: 'Acabados',
    };

    const columnColors = {
        NOT_STARTED: 'bg-slate-300',
        PENDING: 'bg-blue-500',
        DONE: 'bg-emerald-500',
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-semibold text-slate-900">Tareas del equipo</h3>
                    <p className="text-xs text-slate-500">Puedes ver todo y filtrar por responsable</p>
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

            <div className="flex gap-6 overflow-x-auto pb-8 h-[calc(100vh-16rem)]">
            {Object.entries(columns).map(([status, columnTasks]) => (
                <div key={status} className="flex-1 min-w-[320px] alef-card p-4 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-bold text-slate-700 flex items-center gap-2">
                            <div className={cn("w-3 h-3 rounded-full", columnColors[status as keyof typeof columnColors])} />
                            {columnLabels[status as keyof typeof columnLabels]}
                            <span className="alef-chip px-2 py-0.5 text-xs">
                                {(columnTasks as Task[]).length}
                            </span>
                        </h2>
                    </div>

                    <div className="space-y-4 overflow-y-auto h-[calc(100%-3rem)] pr-2 scrollbar-thin">
                        {(columnTasks as Task[]).map((task) => (
                            <TaskCard
                                key={task.id}
                                task={task}
                                onMove={(id, newStatus) => updateMutation.mutate({ id, status: newStatus })}
                            />
                        ))}
                        {(columnTasks as Task[]).length === 0 && (
                            <div className="h-32 border-2 border-dashed border-blue-200/70 rounded-lg flex items-center justify-center text-slate-400 text-sm italic">
                                No hay tareas en {columnLabels[status as keyof typeof columnLabels].toLowerCase()}
                            </div>
                        )}
                    </div>
                </div>
            ))}
            </div>
        </div>
    );
}

function cn(...inputs: (string | undefined | null | false)[]) {
    return inputs.filter(Boolean).join(' ');
}
