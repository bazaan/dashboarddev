'use client';

import { useQuery } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Package, Code } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { CreateEventDialog } from './CreateEventDialog';
import { EventDetailsDialog } from './EventDetailsDialog';

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
        priority: 'HIGH' | 'MEDIUM' | 'LOW';
    };
};

export function CalendarView() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedType, setSelectedType] = useState<'DEVELOPMENT' | 'DELIVERY' | 'ALL'>('ALL');
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [eventDetailsOpen, setEventDetailsOpen] = useState(false);

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

    const { data: events, isLoading } = useQuery<Event[]>({
        queryKey: ['events', format(monthStart, 'yyyy-MM'), format(monthEnd, 'yyyy-MM'), selectedType],
        queryFn: async () => {
            const params = new URLSearchParams({
                startDate: monthStart.toISOString(),
                endDate: monthEnd.toISOString(),
            });
            if (selectedType !== 'ALL') {
                params.append('type', selectedType);
            }
            const res = await fetch(`/api/events?${params.toString()}`);
            if (!res.ok) throw new Error('Failed to fetch events');
            return res.json();
        },
    });

    const previousMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const getEventsForDay = (day: Date) => {
        if (!events) return [];
        return events.filter((event) => {
            const start = new Date(event.startDate);
            const end = new Date(event.endDate);
            return day >= start && day <= end;
        });
    };

    const getProgressColor = (progress: number) => {
        if (progress >= 80) return 'bg-green-500';
        if (progress >= 50) return 'bg-yellow-500';
        if (progress >= 25) return 'bg-orange-500';
        return 'bg-red-500';
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'DEVELOPMENT':
                return <Code className="w-3 h-3" />;
            case 'DELIVERY':
                return <Package className="w-3 h-3" />;
            default:
                return <CalendarIcon className="w-3 h-3" />;
        }
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
            {/* Header con navegación y filtros */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-bold text-slate-900">
                        {format(currentDate, 'MMMM yyyy')}
                    </h2>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={previousMonth}>
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={nextMonth}>
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentDate(new Date())}
                        >
                            Hoy
                        </Button>
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex gap-2">
                        <Button
                            variant={selectedType === 'ALL' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setSelectedType('ALL')}
                        >
                            Todos
                        </Button>
                        <Button
                            variant={selectedType === 'DEVELOPMENT' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setSelectedType('DEVELOPMENT')}
                        >
                            <Code className="w-4 h-4 mr-2" />
                            Desarrollo
                        </Button>
                        <Button
                            variant={selectedType === 'DELIVERY' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setSelectedType('DELIVERY')}
                        >
                            <Package className="w-4 h-4 mr-2" />
                            Entrega
                        </Button>
                    </div>
                    <CreateEventDialog />
                </div>
            </div>

            {/* Grid del calendario */}
            <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                {/* Días de la semana */}
                <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200">
                    {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
                        <div key={day} className="p-2 text-center text-sm font-semibold text-slate-600">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Días del mes */}
                <div className="grid grid-cols-7">
                    {daysInMonth.map((day, idx) => {
                        const dayEvents = getEventsForDay(day);
                        const isToday = isSameDay(day, new Date());
                        const isCurrentMonth = isSameMonth(day, currentDate);

                        return (
                            <div
                                key={idx}
                                className={cn(
                                    'min-h-[100px] border-r border-b border-slate-200 p-2',
                                    !isCurrentMonth && 'bg-slate-50 text-slate-400',
                                    isToday && 'bg-blue-50'
                                )}
                            >
                                <div
                                    className={cn(
                                        'text-sm font-semibold mb-1',
                                        isToday && 'text-blue-600',
                                        !isCurrentMonth && 'text-slate-400'
                                    )}
                                >
                                    {format(day, 'd')}
                                </div>
                                <div className="space-y-1">
                                    {dayEvents.slice(0, 2).map((event) => (
                                        <div
                                            key={event.id}
                                            className={cn(
                                                'text-xs p-1 rounded truncate cursor-pointer hover:opacity-80 transition-all',
                                                event.type === 'DEVELOPMENT' && 'bg-blue-100 text-blue-800 hover:bg-blue-200',
                                                event.type === 'DELIVERY' && 'bg-green-100 text-green-800 hover:bg-green-200',
                                                event.type === 'OTHER' && 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                                            )}
                                            title={`${event.title} - ${event.progress}% - Click para detalles`}
                                            onClick={() => {
                                                setSelectedEvent(event);
                                                setEventDetailsOpen(true);
                                            }}
                                        >
                                            <div className="flex items-center gap-1">
                                                {getTypeIcon(event.type)}
                                                <span className="truncate">{event.title}</span>
                                            </div>
                                            {event.progress > 0 && (
                                                <div className="mt-1">
                                                    <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
                                                        <div
                                                            className={cn(
                                                                'h-full transition-all',
                                                                getProgressColor(event.progress)
                                                            )}
                                                            style={{ width: `${event.progress}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {dayEvents.length > 2 && (
                                        <div className="text-xs text-slate-500 cursor-pointer hover:text-slate-700"
                                            onClick={() => {
                                                // Mostrar el primer evento adicional
                                                if (dayEvents[2]) {
                                                    setSelectedEvent(dayEvents[2]);
                                                    setEventDetailsOpen(true);
                                                }
                                            }}
                                        >
                                            +{dayEvents.length - 2} más
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Leyenda */}
            <div className="flex items-center gap-4 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-100 rounded" />
                    <span>Desarrollo</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-100 rounded" />
                    <span>Entrega</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-slate-100 rounded" />
                    <span>Otro</span>
                </div>
            </div>

            {/* Diálogo de detalles del evento */}
            {selectedEvent && (
                <EventDetailsDialog
                    event={selectedEvent}
                    open={eventDetailsOpen}
                    onOpenChange={setEventDetailsOpen}
                />
            )}
        </div>
    );
}
