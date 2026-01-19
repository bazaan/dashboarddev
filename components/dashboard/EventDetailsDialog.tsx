'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { X, Code, Package, Calendar as CalendarIcon, ExternalLink, CheckSquare2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

type Event = {
    id: string;
    title: string;
    description?: string;
    type: 'DEVELOPMENT' | 'DELIVERY' | 'OTHER';
    startDate: string;
    endDate: string;
    progress: number;
    project?: {
        id: string;
        name: string;
        priority: string;
    };
};

type Task = {
    id: string;
    title: string;
    status: string;
    priority: string;
    deadline?: string;
    project?: {
        id: string;
        name: string;
    };
};

interface EventDetailsDialogProps {
    event: Event | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EventDetailsDialog({ event, open, onOpenChange }: EventDetailsDialogProps) {
    const queryClient = useQueryClient();

    // Obtener tareas relacionadas al evento (tareas con deadline dentro del rango del evento o del mismo proyecto)
    const { data: relatedTasks, isLoading: tasksLoading } = useQuery<Task[]>({
        queryKey: ['tasks', 'event-related', event?.id],
        queryFn: async () => {
            if (!event) return [];
            
            const startDate = new Date(event.startDate);
            const endDate = new Date(event.endDate);
            
            const res = await fetch('/api/tasks');
            if (!res.ok) return [];
            const allTasks = await res.json();
            
            // Filtrar tareas que estén dentro del rango de fechas del evento o pertenezcan al mismo proyecto
            return allTasks.filter((task: Task) => {
                if (task.deadline) {
                    const taskDate = new Date(task.deadline);
                    if (taskDate >= startDate && taskDate <= endDate) {
                        return true;
                    }
                }
                if (event.project && task.project && task.project.id === event.project.id) {
                    return true;
                }
                return false;
            });
        },
        enabled: !!event && open,
    });

    if (!event) return null;

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'DEVELOPMENT':
                return <Code className="w-4 h-4" />;
            case 'DELIVERY':
                return <Package className="w-4 h-4" />;
            default:
                return <CalendarIcon className="w-4 h-4" />;
        }
    };

    const getProgressColor = (progress: number) => {
        if (progress >= 80) return 'bg-green-500';
        if (progress >= 50) return 'bg-yellow-500';
        if (progress >= 25) return 'bg-orange-500';
        return 'bg-red-500';
    };

    const priorityColors = {
        HIGH: 'bg-red-100 text-red-800',
        MEDIUM: 'bg-orange-100 text-orange-800',
        LOW: 'bg-green-100 text-green-800',
    };

    const statusColors = {
        PENDING: 'bg-yellow-100 text-yellow-800',
        IN_PROGRESS: 'bg-blue-100 text-blue-800',
        DONE: 'bg-green-100 text-green-800',
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {getTypeIcon(event.type)}
                        {event.title}
                    </DialogTitle>
                    <DialogDescription>
                        Detalles del evento y tareas relacionadas
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Información del evento */}
                    <div className="space-y-2 alef-card p-4">
                        <div className="flex items-center gap-2">
                            <Badge
                                className={cn(
                                    event.type === 'DEVELOPMENT' && 'bg-blue-100 text-blue-800 border border-blue-200',
                                    event.type === 'DELIVERY' && 'bg-emerald-100 text-emerald-800 border border-emerald-200',
                                    event.type === 'OTHER' && 'bg-slate-100 text-slate-800 border border-slate-200'
                                )}
                            >
                                {event.type === 'DEVELOPMENT' && 'Desarrollo'}
                                {event.type === 'DELIVERY' && 'Entrega'}
                                {event.type === 'OTHER' && 'Otro'}
                            </Badge>
                            {event.project && (
                                <Badge variant="outline" className="border-blue-200 text-blue-700">
                                    {event.project.name}
                                </Badge>
                            )}
                        </div>

                        {event.description && (
                            <p className="text-sm text-slate-700 bg-blue-50/60 p-3 rounded-lg border border-blue-100">
                                {event.description}
                            </p>
                        )}

                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-slate-500 font-medium">Fecha Inicio:</span>
                                <p className="text-slate-900">
                                    {format(new Date(event.startDate), 'PPP p')}
                                </p>
                            </div>
                            <div>
                                <span className="text-slate-500 font-medium">Fecha Fin:</span>
                                <p className="text-slate-900">
                                    {format(new Date(event.endDate), 'PPP p')}
                                </p>
                            </div>
                        </div>

                        {/* Barra de progreso */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-700 font-medium">Progreso</span>
                                <span className="text-slate-600">{event.progress}%</span>
                            </div>
                            <div className="h-3 bg-blue-100 rounded-full overflow-hidden">
                                <div
                                    className={cn(
                                        'h-full transition-all',
                                        getProgressColor(event.progress)
                                    )}
                                    style={{ width: `${event.progress}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Tareas relacionadas */}
                    <div className="border-t border-blue-100 pt-4">
                        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                            <CheckSquare2 className="w-5 h-5" />
                            Tareas Relacionadas ({relatedTasks?.length || 0})
                        </h3>

                        {tasksLoading ? (
                            <div className="flex justify-center py-4">
                                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                            </div>
                        ) : relatedTasks && relatedTasks.length > 0 ? (
                            <div className="space-y-2">
                                {relatedTasks.map((task) => (
                                    <div
                                        key={task.id}
                                        className="flex items-start justify-between p-3 bg-blue-50/60 rounded-lg border border-blue-100 hover:bg-blue-50 transition-colors"
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-medium text-slate-900">
                                                    {task.title}
                                                </span>
                                                <Badge
                                                    className={cn(
                                                        'text-xs',
                                                        priorityColors[task.priority as keyof typeof priorityColors] ||
                                                            'bg-slate-100 text-slate-800'
                                                    )}
                                                >
                                                    {task.priority}
                                                </Badge>
                                                <Badge
                                                    className={cn(
                                                        'text-xs',
                                                        statusColors[task.status as keyof typeof statusColors] ||
                                                            'bg-slate-100 text-slate-800'
                                                    )}
                                                >
                                                    {task.status}
                                                </Badge>
                                            </div>
                                            {task.project && (
                                                <p className="text-xs text-slate-500">
                                                    Proyecto: {task.project.name}
                                                </p>
                                            )}
                                            {task.deadline && (
                                                <p className="text-xs text-slate-500">
                                                    Deadline: {format(new Date(task.deadline), 'PPP')}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-slate-500 text-sm">
                                No hay tareas relacionadas con este evento
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
