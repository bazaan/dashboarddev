'use client';

import { useState } from 'react';
import { OceanBoard } from '@/components/dashboard/OceanBoard';
import { CreateTaskDialog } from '@/components/dashboard/CreateTaskDialog';
import { CreateProjectDialog } from '@/components/dashboard/CreateProjectDialog';
import { CalendarView } from '@/components/dashboard/CalendarView';
import { ProjectBriefing } from '@/components/dashboard/ProjectBriefing';
import { DailyWeeklyTasks } from '@/components/dashboard/DailyWeeklyTasks';
import { LayoutDashboard, Calendar, Folder, CheckSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type View = 'tasks' | 'calendar' | 'projects' | 'daily-weekly';

export default function DashboardPage() {
    const [currentView, setCurrentView] = useState<View>('tasks');

    const views = [
        { id: 'tasks' as View, label: 'Tareas', icon: CheckSquare },
        { id: 'daily-weekly' as View, label: 'Diario/Semanal', icon: Calendar },
        { id: 'calendar' as View, label: 'Calendario', icon: LayoutDashboard },
        { id: 'projects' as View, label: 'Proyectos', icon: Folder },
    ];

    return (
        <div className="p-8 h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">ALEF Dashboard</h1>
                    <p className="text-slate-500">Centraliza y gestiona tus tareas, proyectos y calendarios.</p>
                </div>
                <div className="flex gap-2">
                    {currentView === 'tasks' && <CreateTaskDialog />}
                    {currentView === 'projects' && <CreateProjectDialog />}
                </div>
            </div>

            {/* Navegación de vistas */}
            <div className="flex gap-2 mb-6 border-b border-slate-200 pb-2">
                {views.map((view) => {
                    const Icon = view.icon;
                    return (
                        <Button
                            key={view.id}
                            variant={currentView === view.id ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setCurrentView(view.id)}
                            className={cn(
                                'flex items-center gap-2',
                                currentView === view.id && 'bg-blue-600 hover:bg-blue-700'
                            )}
                        >
                            <Icon className="w-4 h-4" />
                            {view.label}
                        </Button>
                    );
                })}
            </div>

            {/* Contenido de la vista actual */}
            <div className="flex-1 overflow-auto">
                {currentView === 'tasks' && <OceanBoard />}
                {currentView === 'daily-weekly' && <DailyWeeklyTasks />}
                {currentView === 'calendar' && <CalendarView />}
                {currentView === 'projects' && <ProjectBriefing />}
            </div>
        </div>
    );
}
