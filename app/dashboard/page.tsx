'use client';

import { useEffect, useState } from 'react';
import { OceanBoard } from '@/components/dashboard/OceanBoard';
import { CreateTaskDialog } from '@/components/dashboard/CreateTaskDialog';
import { CreateProjectDialog } from '@/components/dashboard/CreateProjectDialog';
import { CalendarView } from '@/components/dashboard/CalendarView';
import { ProjectBriefing } from '@/components/dashboard/ProjectBriefing';
import { DailyWeeklyTasks } from '@/components/dashboard/DailyWeeklyTasks';
import { OverviewPanel } from '@/components/dashboard/OverviewPanel';
import { ReportsPanel } from '@/components/dashboard/ReportsPanel';
import { NotesPanel } from '@/components/dashboard/NotesPanel';
import { AdminPanel } from '@/components/dashboard/AdminPanel';
import { LayoutDashboard, Calendar, Folder, CheckSquare, ClipboardList, StickyNote, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

type View = 'overview' | 'tasks' | 'calendar' | 'projects' | 'daily-weekly' | 'reports' | 'notes' | 'admin';

export default function DashboardPage() {
    const [currentView, setCurrentView] = useState<View>('overview');
    const [role, setRole] = useState<'ADMIN' | 'DEVELOPER'>('DEVELOPER');

    useEffect(() => {
        const loadRole = async () => {
            const supabase = createSupabaseBrowserClient();
            const { data } = await supabase.auth.getUser();
            const userRole = data.user?.user_metadata?.role;
            if (userRole === 'ADMIN') {
                setRole('ADMIN');
            }
        };
        void loadRole();
    }, []);

    const views = [
        { id: 'overview' as View, label: 'Resumen', icon: LayoutDashboard },
        { id: 'tasks' as View, label: 'Tareas', icon: CheckSquare },
        { id: 'daily-weekly' as View, label: 'Diario/Semanal', icon: Calendar },
        { id: 'calendar' as View, label: 'Calendario', icon: ClipboardList },
        { id: 'projects' as View, label: 'Proyectos', icon: Folder },
        { id: 'reports' as View, label: 'Reportes', icon: ClipboardList },
        { id: 'notes' as View, label: 'Notas', icon: StickyNote },
        ...(role === 'ADMIN' ? [{ id: 'admin' as View, label: 'Admin', icon: Shield }] : []),
    ];

    return (
        <div className="p-8 h-screen bg-gradient-to-br from-blue-50/60 via-white to-slate-50 overflow-hidden flex flex-col">
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
                {currentView === 'overview' && <OverviewPanel />}
                {currentView === 'tasks' && <OceanBoard />}
                {currentView === 'daily-weekly' && <DailyWeeklyTasks />}
                {currentView === 'calendar' && <CalendarView />}
                {currentView === 'projects' && <ProjectBriefing />}
                {currentView === 'reports' && <ReportsPanel />}
                {currentView === 'notes' && <NotesPanel />}
                {currentView === 'admin' && role === 'ADMIN' && <AdminPanel />}
            </div>
        </div>
    );
}
