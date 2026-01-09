'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, ChevronDown, ChevronUp, FileText, Workflow, LayoutDashboard, Folder } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';

type Project = {
    id: string;
    name: string;
    description?: string;
    brief?: string;
    detailedBrief?: string;
    drivePromptsUrl?: string;
    driveN8nFlowUrl?: string;
    driveDashboardUrl?: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    orderIndex: number;
    status: 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'ARCHIVED';
    owner: {
        id: string;
        name: string | null;
        email: string;
    };
    tasks: Array<{
        id: string;
        title: string;
        status: string;
        priority: string;
    }>;
    events: Array<{
        id: string;
        title: string;
        type: string;
        startDate: string;
        endDate: string;
        progress: number;
    }>;
    createdAt: string;
    updatedAt: string;
};

const priorityColors = {
    HIGH: 'bg-red-100 text-red-800 border-red-300',
    MEDIUM: 'bg-orange-100 text-orange-800 border-orange-300',
    LOW: 'bg-green-100 text-green-800 border-green-300',
};

const statusColors = {
    ACTIVE: 'bg-blue-100 text-blue-800',
    ON_HOLD: 'bg-yellow-100 text-yellow-800',
    COMPLETED: 'bg-green-100 text-green-800',
    ARCHIVED: 'bg-slate-100 text-slate-800',
};

export function ProjectBriefing() {
    const [expandedProject, setExpandedProject] = useState<string | null>(null);
    const queryClient = useQueryClient();

    const { data: projects, isLoading } = useQuery<Project[]>({
        queryKey: ['projects'],
        queryFn: async () => {
            const res = await fetch('/api/projects');
            if (!res.ok) throw new Error('Failed to fetch projects');
            return res.json();
        },
    });

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    if (!projects || projects.length === 0) {
        return (
            <div className="text-center py-12 text-slate-500">
                <Folder className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No hay proyectos disponibles</p>
            </div>
        );
    }

    const toggleExpand = (projectId: string) => {
        setExpandedProject(expandedProject === projectId ? null : projectId);
    };

    return (
        <div className="space-y-4">
            {projects.map((project) => {
                const isExpanded = expandedProject === project.id;
                const hasDriveLinks = project.drivePromptsUrl || project.driveN8nFlowUrl || project.driveDashboardUrl;

                return (
                    <motion.div
                        key={project.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden"
                    >
                        {/* Header del proyecto */}
                        <div
                            className="p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                            onClick={() => toggleExpand(project.id)}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-lg font-semibold text-slate-900">{project.name}</h3>
                                        <Badge className={cn('border', priorityColors[project.priority])}>
                                            {project.priority}
                                        </Badge>
                                        <Badge className={statusColors[project.status]}>
                                            {project.status === 'ACTIVE' && 'Activo'}
                                            {project.status === 'ON_HOLD' && 'En Pausa'}
                                            {project.status === 'COMPLETED' && 'Completado'}
                                            {project.status === 'ARCHIVED' && 'Archivado'}
                                        </Badge>
                                    </div>
                                    {project.description && (
                                        <p className="text-sm text-slate-600 mb-2">{project.description}</p>
                                    )}
                                    <div className="flex items-center gap-4 text-xs text-slate-500">
                                        <span>Owner: {project.owner.name || project.owner.email}</span>
                                        <span>{project.tasks.length} tareas</span>
                                        <span>{project.events.length} eventos</span>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="ml-4"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleExpand(project.id);
                                    }}
                                >
                                    {isExpanded ? (
                                        <ChevronUp className="w-4 h-4" />
                                    ) : (
                                        <ChevronDown className="w-4 h-4" />
                                    )}
                                </Button>
                            </div>
                        </div>

                        {/* Contenido expandido */}
                        <AnimatePresence>
                            {isExpanded && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="border-t border-slate-200"
                                >
                                    <div className="p-4 space-y-4">
                                        {/* Briefing simplificado */}
                                        {project.brief && (
                                            <div>
                                                <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                                                    <FileText className="w-4 h-4" />
                                                    Briefing
                                                </h4>
                                                <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
                                                    {project.brief}
                                                </p>
                                            </div>
                                        )}

                                        {/* Briefing detallado/explayado */}
                                        {project.detailedBrief && (
                                            <div>
                                                <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                                                    <FileText className="w-4 h-4" />
                                                    Briefing Detallado
                                                </h4>
                                                <div className="text-sm text-slate-600 bg-slate-50 p-4 rounded-lg whitespace-pre-wrap">
                                                    {project.detailedBrief}
                                                </div>
                                            </div>
                                        )}

                                        {/* Enlaces a Google Drive */}
                                        {hasDriveLinks && (
                                            <div>
                                                <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                                                    <Folder className="w-4 h-4" />
                                                    Recursos en Drive
                                                </h4>
                                                <div className="space-y-2">
                                                    {project.drivePromptsUrl && (
                                                        <a
                                                            href={project.drivePromptsUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 p-2 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
                                                        >
                                                            <FileText className="w-4 h-4" />
                                                            <span>Prompts y Documentación</span>
                                                            <ExternalLink className="w-3 h-3 ml-auto" />
                                                        </a>
                                                    )}
                                                    {project.driveN8nFlowUrl && (
                                                        <a
                                                            href={project.driveN8nFlowUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 p-2 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
                                                        >
                                                            <Workflow className="w-4 h-4" />
                                                            <span>Concepto del Flujo n8n</span>
                                                            <ExternalLink className="w-3 h-3 ml-auto" />
                                                        </a>
                                                    )}
                                                    {project.driveDashboardUrl && (
                                                        <a
                                                            href={project.driveDashboardUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 p-2 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
                                                        >
                                                            <LayoutDashboard className="w-4 h-4" />
                                                            <span>Accesos del Dashboard</span>
                                                            <ExternalLink className="w-3 h-3 ml-auto" />
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Tareas del proyecto */}
                                        {project.tasks.length > 0 && (
                                            <div>
                                                <h4 className="text-sm font-semibold text-slate-700 mb-2">
                                                    Tareas ({project.tasks.length})
                                                </h4>
                                                <div className="space-y-1">
                                                    {project.tasks.slice(0, 5).map((task) => (
                                                        <div
                                                            key={task.id}
                                                            className="text-sm text-slate-600 bg-slate-50 p-2 rounded"
                                                        >
                                                            {task.title} - {task.status} - {task.priority}
                                                        </div>
                                                    ))}
                                                    {project.tasks.length > 5 && (
                                                        <p className="text-xs text-slate-500">
                                                            +{project.tasks.length - 5} más...
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Eventos del proyecto */}
                                        {project.events.length > 0 && (
                                            <div>
                                                <h4 className="text-sm font-semibold text-slate-700 mb-2">
                                                    Eventos ({project.events.length})
                                                </h4>
                                                <div className="space-y-1">
                                                    {project.events.map((event) => (
                                                        <div
                                                            key={event.id}
                                                            className="text-sm text-slate-600 bg-slate-50 p-2 rounded"
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <span>{event.title}</span>
                                                                <span className="text-xs text-slate-500">
                                                                    {format(new Date(event.startDate), 'MMM d')} -{' '}
                                                                    {format(new Date(event.endDate), 'MMM d')}
                                                                </span>
                                                            </div>
                                                            {event.progress > 0 && (
                                                                <div className="mt-2">
                                                                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                                                        <div
                                                                            className="h-full bg-blue-500 transition-all"
                                                                            style={{ width: `${event.progress}%` }}
                                                                        />
                                                                    </div>
                                                                    <span className="text-xs text-slate-500 mt-1">
                                                                        {event.progress}%
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                );
            })}
        </div>
    );
}
