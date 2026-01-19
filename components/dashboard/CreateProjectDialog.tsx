'use client';

import { useState } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
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
import { Plus, Loader2, Folder } from 'lucide-react';

export function CreateProjectDialog() {
    const [open, setOpen] = useState(false);
    const queryClient = useQueryClient();

    const createMutation = useMutation({
        mutationFn: async (data: {
            name: unknown;
            description?: unknown;
            brief?: unknown;
            detailedBrief?: unknown;
            drivePromptsUrl?: unknown;
            driveN8nFlowUrl?: unknown;
            driveDashboardUrl?: unknown;
            priority: unknown;
        }) => {
            const res = await fetch('/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed to create project');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            setOpen(false);
        },
    });

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        createMutation.mutate({
            name: formData.get('name'),
            description: formData.get('description') || undefined,
            brief: formData.get('brief') || undefined,
            detailedBrief: formData.get('detailedBrief') || undefined,
            drivePromptsUrl: formData.get('drivePromptsUrl') || undefined,
            driveN8nFlowUrl: formData.get('driveN8nFlowUrl') || undefined,
            driveDashboardUrl: formData.get('driveDashboardUrl') || undefined,
            priority: formData.get('priority'),
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="shadow-md shadow-blue-200/60">
                    <Plus className="mr-2 h-4 w-4" /> <Folder className="mr-2 h-4 w-4" /> Nuevo Proyecto
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Crear Nuevo Proyecto</DialogTitle>
                    <DialogDescription>
                        Crea un nuevo proyecto con briefing y enlaces a recursos en Drive.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <label htmlFor="name" className="text-right text-sm font-semibold text-slate-700">
                            Nombre *
                        </label>
                        <Input id="name" name="name" className="col-span-3" required />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <label htmlFor="description" className="text-right text-sm font-semibold text-slate-700">
                            Descripción
                        </label>
                        <Textarea id="description" name="description" className="col-span-3" rows={3} />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <label htmlFor="priority" className="text-right text-sm font-semibold text-slate-700">
                            Prioridad *
                        </label>
                        <Select id="priority" name="priority" className="col-span-3" required>
                            <option value="HIGH">Alta</option>
                            <option value="MEDIUM">Media</option>
                            <option value="LOW">Baja</option>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-start gap-4">
                        <label htmlFor="brief" className="text-right text-sm font-semibold text-slate-700 pt-2">
                            Briefing
                        </label>
                        <Textarea
                            id="brief"
                            name="brief"
                            className="col-span-3"
                            rows={4}
                            placeholder="Briefing simplificado del proyecto..."
                        />
                    </div>
                    <div className="grid grid-cols-4 items-start gap-4">
                        <label htmlFor="detailedBrief" className="text-right text-sm font-semibold text-slate-700 pt-2">
                            Briefing Detallado
                        </label>
                        <Textarea
                            id="detailedBrief"
                            name="detailedBrief"
                            className="col-span-3"
                            rows={6}
                            placeholder="Briefing detallado/explayado del proyecto..."
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <label htmlFor="drivePromptsUrl" className="text-right text-sm font-semibold text-slate-700">
                            Drive: Prompts
                        </label>
                        <Input
                            id="drivePromptsUrl"
                            name="drivePromptsUrl"
                            type="url"
                            className="col-span-3"
                            placeholder="https://drive.google.com/..."
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <label htmlFor="driveN8nFlowUrl" className="text-right text-sm font-semibold text-slate-700">
                            Drive: Flujo n8n
                        </label>
                        <Input
                            id="driveN8nFlowUrl"
                            name="driveN8nFlowUrl"
                            type="url"
                            className="col-span-3"
                            placeholder="https://drive.google.com/..."
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <label htmlFor="driveDashboardUrl" className="text-right text-sm font-semibold text-slate-700">
                            Drive: Dashboard
                        </label>
                        <Input
                            id="driveDashboardUrl"
                            name="driveDashboardUrl"
                            type="url"
                            className="col-span-3"
                            placeholder="https://drive.google.com/..."
                        />
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={createMutation.isPending}>
                            {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Crear Proyecto
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
