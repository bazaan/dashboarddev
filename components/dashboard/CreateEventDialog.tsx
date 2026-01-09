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
import { Plus, Loader2, Calendar as CalendarIcon, Code, Package } from 'lucide-react';

export function CreateEventDialog() {
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

    const { data: tasks } = useQuery({
        queryKey: ['tasks'],
        queryFn: async () => {
            const res = await fetch('/api/tasks');
            if (!res.ok) return [];
            return res.json();
        },
    });

    const createMutation = useMutation({
        mutationFn: async (data: {
            title: unknown;
            description?: unknown;
            type: unknown;
            startDate: unknown;
            endDate: unknown;
            progress?: unknown;
            projectId?: unknown;
        }) => {
            const res = await fetch('/api/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to create event');
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['events'] });
            setOpen(false);
        },
    });

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        
        // Convertir fechas a formato ISO
        const startDate = formData.get('startDate');
        const endDate = formData.get('endDate');
        const startTime = formData.get('startTime') || '00:00';
        const endTime = formData.get('endTime') || '23:59';
        
        const startDateTime = startDate ? `${startDate}T${startTime}:00` : undefined;
        const endDateTime = endDate ? `${endDate}T${endTime}:00` : undefined;

        createMutation.mutate({
            title: formData.get('title'),
            description: formData.get('description') || undefined,
            type: formData.get('type'),
            startDate: startDateTime,
            endDate: endDateTime,
            progress: formData.get('progress') ? parseInt(formData.get('progress') as string) : 0,
            projectId: formData.get('projectId') && formData.get('projectId') !== '' ? formData.get('projectId') : undefined,
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Plus className="mr-2 h-4 w-4" />
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    Nuevo Evento
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Crear Nuevo Evento</DialogTitle>
                    <DialogDescription>
                        Crea un evento de desarrollo o entrega vinculado a tareas y proyectos.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <label htmlFor="title" className="text-right text-sm font-medium">
                            Título *
                        </label>
                        <Input id="title" name="title" className="col-span-3" required />
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
                            placeholder="Descripción del evento..."
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <label htmlFor="type" className="text-right text-sm font-medium">
                            Tipo *
                        </label>
                        <Select id="type" name="type" className="col-span-3" required>
                            <option value="DEVELOPMENT">Desarrollo</option>
                            <option value="DELIVERY">Entrega</option>
                            <option value="OTHER">Otro</option>
                        </Select>
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
                        <label htmlFor="startDate" className="text-right text-sm font-medium">
                            Fecha Inicio *
                        </label>
                        <Input
                            id="startDate"
                            name="startDate"
                            type="date"
                            className="col-span-3"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <label htmlFor="startTime" className="text-right text-sm font-medium">
                            Hora Inicio
                        </label>
                        <Input
                            id="startTime"
                            name="startTime"
                            type="time"
                            className="col-span-3"
                            defaultValue="00:00"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <label htmlFor="endDate" className="text-right text-sm font-medium">
                            Fecha Fin *
                        </label>
                        <Input
                            id="endDate"
                            name="endDate"
                            type="date"
                            className="col-span-3"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <label htmlFor="endTime" className="text-right text-sm font-medium">
                            Hora Fin
                        </label>
                        <Input
                            id="endTime"
                            name="endTime"
                            type="time"
                            className="col-span-3"
                            defaultValue="23:59"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <label htmlFor="progress" className="text-right text-sm font-medium">
                            Progreso (%)
                        </label>
                        <Input
                            id="progress"
                            name="progress"
                            type="number"
                            min="0"
                            max="100"
                            defaultValue="0"
                            className="col-span-3"
                        />
                    </div>
                    {createMutation.isError && (
                        <div className="col-span-4 text-red-600 text-sm text-center">
                            {createMutation.error instanceof Error
                                ? createMutation.error.message
                                : 'Error al crear el evento'}
                        </div>
                    )}
                    <DialogFooter>
                        <Button type="submit" disabled={createMutation.isPending}>
                            {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Crear Evento
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
