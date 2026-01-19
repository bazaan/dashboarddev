'use client';

import { useState } from 'react';
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Loader2 } from 'lucide-react';

export function CreateTaskDialog() {
    const [open, setOpen] = useState(false);
    const queryClient = useQueryClient();

    const { data: projects } = useQuery({
        queryKey: ['projects'],
        queryFn: async () => {
            const res = await fetch('/api/projects');
            if (!res.ok) return [];
            return res.json();
        },
    });

    const createMutation = useMutation({
        mutationFn: async (data: {
            title: unknown;
            description?: unknown;
            priority: unknown;
            status?: unknown;
            deadline?: unknown;
            projectId?: unknown;
            recurrenceType?: unknown;
            cadence?: unknown;
            timeEstimateMins?: unknown;
        }) => {
            const res = await fetch('/api/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to create task');
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            setOpen(false);
        },
    });

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const projectId = formData.get('projectId');
        const recurrenceType = formData.get('recurrenceType');
        const cadence = formData.get('cadence');
        createMutation.mutate({
            title: formData.get('title'),
            description: formData.get('description'),
            priority: formData.get('priority'),
            status: formData.get('status') || 'NOT_STARTED',
            deadline: formData.get('deadline') || undefined,
            projectId: projectId && projectId !== '' ? projectId : undefined,
            recurrenceType: recurrenceType && recurrenceType !== 'NONE' ? recurrenceType : undefined,
            cadence: cadence && cadence !== 'NONE' ? cadence : undefined,
            timeEstimateMins: formData.get('timeEstimateMins') || undefined,
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="shadow-md shadow-blue-200/60">
                    <Plus className="mr-2 h-4 w-4" /> Nueva Tarea
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Crear Nueva Tarea</DialogTitle>
                    <DialogDescription>
                        Agrega una nueva tarea al tablero. Completa los campos y guarda cuando termines.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <label htmlFor="title" className="text-right text-sm font-semibold text-slate-700">
                            Título *
                        </label>
                        <Input id="title" name="title" className="col-span-3" placeholder="Nombre de la tarea" required />
                    </div>
                    <div className="grid grid-cols-4 items-start gap-4">
                        <label htmlFor="description" className="text-right text-sm font-semibold text-slate-700 pt-2">
                            Descripción
                        </label>
                        <Textarea
                            id="description"
                            name="description"
                            className="col-span-3"
                            rows={3}
                            placeholder="Descripción detallada de la tarea..."
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <label htmlFor="priority" className="text-right text-sm font-semibold text-slate-700">
                            Prioridad *
                        </label>
                        <Select id="priority" name="priority" className="col-span-3" defaultValue="MEDIUM" required>
                            <option value="HIGH">🔴 Alta (High)</option>
                            <option value="MEDIUM">🟠 Media (Medium)</option>
                            <option value="LOW">🟢 Baja (Low)</option>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <label htmlFor="status" className="text-right text-sm font-semibold text-slate-700">
                            Estado *
                        </label>
                        <Select id="status" name="status" className="col-span-3" defaultValue="NOT_STARTED" required>
                            <option value="NOT_STARTED">⚪ Sin Iniciar</option>
                            <option value="PENDING">🟡 Pendiente</option>
                            <option value="IN_PROGRESS">🔵 En Progreso</option>
                            <option value="DONE">🟢 Acabado</option>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <label htmlFor="timeEstimateMins" className="text-right text-sm font-semibold text-slate-700">
                            Tiempo est. (min)
                        </label>
                        <Input id="timeEstimateMins" name="timeEstimateMins" type="number" min="0" className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <label htmlFor="deadline" className="text-right text-sm font-semibold text-slate-700">
                            Deadline
                        </label>
                        <Input id="deadline" name="deadline" type="date" className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <label htmlFor="projectId" className="text-right text-sm font-semibold text-slate-700">
                            Proyecto
                        </label>
                        <Select id="projectId" name="projectId" className="col-span-3">
                            <option value="">Sin proyecto</option>
                            {projects?.map((project: { id: string; name: string }) => (
                                <option key={project.id} value={project.id}>
                                    {project.name}
                                </option>
                            ))}
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <label htmlFor="cadence" className="text-right text-sm font-semibold text-slate-700">
                            Clasificación
                        </label>
                        <Select id="cadence" name="cadence" className="col-span-3" defaultValue="NONE">
                            <option value="NONE">Sin clasificación</option>
                            <option value="DAILY">Daily Task</option>
                            <option value="WEEKLY">Weekly Task</option>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <label htmlFor="recurrenceType" className="text-right text-sm font-semibold text-slate-700">
                            Recurrencia
                        </label>
                        <Select id="recurrenceType" name="recurrenceType" className="col-span-3" defaultValue="NONE">
                            <option value="NONE">Sin recurrencia</option>
                            <option value="DAILY">Diaria</option>
                            <option value="WEEKLY">Semanal</option>
                        </Select>
                    </div>
                    {createMutation.isError && (
                        <div className="col-span-4 text-red-600 text-sm text-center">
                            {createMutation.error instanceof Error
                                ? createMutation.error.message
                                : 'Error al crear la tarea'}
                        </div>
                    )}
                    <DialogFooter>
                        <Button type="submit" disabled={createMutation.isPending}>
                            {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Crear Tarea
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
