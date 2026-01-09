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
        createMutation.mutate({
            title: formData.get('title'),
            description: formData.get('description'),
            priority: formData.get('priority'),
            status: formData.get('status') || 'NOT_STARTED',
            deadline: formData.get('deadline') || undefined,
            projectId: projectId && projectId !== '' ? projectId : undefined,
            recurrenceType: recurrenceType && recurrenceType !== 'NONE' ? recurrenceType : undefined,
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
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
                        <label htmlFor="title" className="text-right text-sm font-medium">
                            Título *
                        </label>
                        <Input id="title" name="title" className="col-span-3" placeholder="Nombre de la tarea" required />
                    </div>
                    <div className="grid grid-cols-4 items-start gap-4">
                        <label htmlFor="description" className="text-right text-sm font-medium pt-2">
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
                        <label htmlFor="priority" className="text-right text-sm font-medium">
                            Prioridad *
                        </label>
                        <Select id="priority" name="priority" className="col-span-3" required>
                            <option value="HIGH">🔴 Alta (High)</option>
                            <option value="MEDIUM" selected>🟠 Media (Medium)</option>
                            <option value="LOW">🟢 Baja (Low)</option>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <label htmlFor="status" className="text-right text-sm font-medium">
                            Estado *
                        </label>
                        <Select id="status" name="status" className="col-span-3" required>
                            <option value="NOT_STARTED" selected>⚪ Sin Iniciar</option>
                            <option value="PENDING">🟡 Pendiente</option>
                            <option value="IN_PROGRESS">🔵 En Progreso</option>
                            <option value="DONE">🟢 Acabado</option>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <label htmlFor="deadline" className="text-right text-sm font-medium">
                            Deadline
                        </label>
                        <Input id="deadline" name="deadline" type="date" className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <label htmlFor="projectId" className="text-right text-sm font-medium">
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
                        <label htmlFor="recurrenceType" className="text-right text-sm font-medium">
                            Recurrencia
                        </label>
                        <Select id="recurrenceType" name="recurrenceType" className="col-span-3">
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
