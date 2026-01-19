import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';

type Note = {
  id: string;
  title: string;
  content: string;
  scope: 'PERSONAL' | 'PROJECT' | 'SHARED';
};

export function NotesPanel() {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [scope, setScope] = useState<'PERSONAL' | 'PROJECT' | 'SHARED'>('PERSONAL');

  const { data: notes } = useQuery<Note[]>({
    queryKey: ['notes'],
    queryFn: async () => {
      const res = await fetch('/api/notes');
      if (!res.ok) throw new Error('Failed to fetch notes');
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, scope }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'No se pudo crear la nota');
      }
      return res.json();
    },
    onSuccess: () => {
      setTitle('');
      setContent('');
      setScope('PERSONAL');
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Notas y documentación</h2>
          <p className="text-sm text-slate-500">Decisiones técnicas y acuerdos internos</p>
        </div>
      </div>

      <div className="alef-card p-4">
        <div className="grid gap-3 md:grid-cols-3">
          <Input placeholder="Título de la nota" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Select value={scope} onChange={(e) => setScope(e.target.value as 'PERSONAL' | 'PROJECT' | 'SHARED')}>
            <option value="PERSONAL">Personal</option>
            <option value="PROJECT">Proyecto</option>
            <option value="SHARED">Compartida</option>
          </Select>
          <Button onClick={() => createMutation.mutate()} disabled={!title || !content || createMutation.isPending}>
            Crear nota
          </Button>
        </div>
        <Textarea
          className="mt-3"
          rows={3}
          placeholder="Contenido de la nota..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {notes?.map((note) => (
          <div key={note.id} className="alef-card p-4">
            <p className="text-sm font-medium text-slate-900">{note.title}</p>
            <p className="mt-2 text-sm text-slate-500">{note.content}</p>
          </div>
        ))}
        {notes?.length === 0 && (
          <div className="alef-card p-4 text-sm text-slate-500">
            Sin notas todavía
          </div>
        )}
      </div>
    </div>
  );
}
