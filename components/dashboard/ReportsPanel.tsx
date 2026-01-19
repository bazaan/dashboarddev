import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';

type Report = {
  id: string;
  title: string;
  body: string;
  type: 'DAILY' | 'WEEKLY';
  status: 'OPEN' | 'RESOLVED';
  author?: { name?: string; email?: string };
  comments?: { id: string; body: string; author?: { name?: string } }[];
};

export function ReportsPanel() {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [type, setType] = useState<'DAILY' | 'WEEKLY'>('DAILY');

  const { data: reports } = useQuery<Report[]>({
    queryKey: ['reports'],
    queryFn: async () => {
      const res = await fetch('/api/reports');
      if (!res.ok) throw new Error('Failed to fetch reports');
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body, type }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'No se pudo crear el reporte');
      }
      return res.json();
    },
    onSuccess: () => {
      setTitle('');
      setBody('');
      setType('DAILY');
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });

  const resolveMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/reports/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'RESOLVED' }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'No se pudo resolver');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });

  const commentMutation = useMutation({
    mutationFn: async ({ reportId, body: commentBody }: { reportId: string; body: string }) => {
      const res = await fetch(`/api/reports/${reportId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: commentBody }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'No se pudo comentar');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });

  const [commentBody, setCommentBody] = useState<Record<string, string>>({});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Reportes internos</h2>
          <p className="text-sm text-slate-500">Avances, bloqueos y solicitudes técnicas</p>
        </div>
      </div>

      <div className="alef-card p-4">
        <div className="grid gap-3 md:grid-cols-3">
          <Input placeholder="Título del reporte" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Select value={type} onChange={(e) => setType(e.target.value as 'DAILY' | 'WEEKLY')}>
            <option value="DAILY">Diario</option>
            <option value="WEEKLY">Semanal</option>
          </Select>
          <Button onClick={() => createMutation.mutate()} disabled={!title || !body || createMutation.isPending}>
            Crear reporte
          </Button>
        </div>
        <Textarea
          className="mt-3"
          rows={3}
          placeholder="Detalle del reporte..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
      </div>

      <div className="space-y-3">
        {reports?.map((report) => (
          <div key={report.id} className="alef-card p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-900">
                {report.type === 'DAILY' ? 'Reporte diario' : 'Reporte semanal'} · {report.title}
              </p>
              <span className="alef-chip px-2 py-1 text-xs">
                {report.status === 'OPEN' ? 'Abierto' : 'Resuelto'}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-500">{report.body}</p>
            <div className="mt-3 space-y-2">
              {report.comments?.map((comment) => (
                <div key={comment.id} className="rounded-md bg-blue-50/60 p-2 text-xs text-slate-700">
                  <span className="font-semibold">{comment.author?.name || 'Usuario'}:</span> {comment.body}
                </div>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <Input
                placeholder="Responder..."
                value={commentBody[report.id] || ''}
                onChange={(e) =>
                  setCommentBody((prev) => ({ ...prev, [report.id]: e.target.value }))
                }
              />
              <Button
                variant="outline"
                onClick={() => {
                  const bodyValue = commentBody[report.id];
                  if (!bodyValue) return;
                  commentMutation.mutate({ reportId: report.id, body: bodyValue });
                  setCommentBody((prev) => ({ ...prev, [report.id]: '' }));
                }}
              >
                Responder
              </Button>
              {report.status === 'OPEN' && (
                <Button onClick={() => resolveMutation.mutate(report.id)}>
                  Marcar resuelto
                </Button>
              )}
            </div>
          </div>
        ))}
        {reports?.length === 0 && (
          <div className="alef-card p-4 text-sm text-slate-500">
            Sin reportes todavía
          </div>
        )}
      </div>
    </div>
  );
}
