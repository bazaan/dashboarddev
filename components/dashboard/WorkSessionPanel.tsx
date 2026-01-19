'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type WorkSession = {
  id: string;
  status: 'ACTIVE' | 'BREAK' | 'ENDED';
  startedAt: string;
  breakStart?: string | null;
  breakEnd?: string | null;
  endedAt?: string | null;
  user: { id: string; name?: string | null; email: string };
};

type WorkSessionResponse = {
  sessions: WorkSession[];
  currentUserId: string | null;
};

export function WorkSessionPanel() {
  const queryClient = useQueryClient();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data, isError, error } = useQuery<WorkSessionResponse>({
    queryKey: ['work-sessions'],
    queryFn: async () => {
      const res = await fetch('/api/work-sessions');
      if (!res.ok) {
        let message = 'No se pudo cargar horarios';
        try {
          const payload = await res.json();
          if (payload?.error) message = payload.error;
        } catch {
          // ignore parse errors
        }
        throw new Error(message);
      }
      return res.json();
    },
    refetchInterval: 15000,
  });

  const actionMutation = useMutation({
    mutationFn: async (action: 'start' | 'break_start' | 'break_end' | 'end') => {
      const res = await fetch('/api/work-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'No se pudo actualizar');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-sessions'] });
      setErrorMessage(null);
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'No se pudo actualizar';
      setErrorMessage(message);
    },
  });

  const sessions = data?.sessions ?? [];
  const activeSessions = (sessions || []).filter((s) => s.status !== 'ENDED');
  const recentSessions = (sessions || []).slice(0, 10);
  const mySession = useMemo(() => {
    if (!currentUserId) return null;
    return activeSessions.find((s) => s.user.id === currentUserId) || null;
  }, [activeSessions, currentUserId]);

  useEffect(() => {
    if (data?.currentUserId) {
      setCurrentUserId(data.currentUserId);
    }
  }, [data?.currentUserId]);

  useEffect(() => {
    if (isError) {
      const message = error instanceof Error ? error.message : 'No se pudo cargar horarios';
      setErrorMessage(message);
    }
  }, [isError, error]);

  useEffect(() => {
    const computeElapsed = () => {
      if (!mySession) {
        setElapsedMs(0);
        return;
      }
      const start = new Date(mySession.startedAt).getTime();
      const now = Date.now();
      let total = now - start;
      if (mySession.breakStart) {
        const breakStart = new Date(mySession.breakStart).getTime();
        const breakEnd = mySession.breakEnd ? new Date(mySession.breakEnd).getTime() : now;
        total -= Math.max(0, breakEnd - breakStart);
      }
      setElapsedMs(Math.max(0, total));
    };

    computeElapsed();
    const interval = setInterval(computeElapsed, 1000);
    return () => clearInterval(interval);
  }, [mySession]);

  const formatDuration = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="alef-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Horarios del equipo</h3>
          <p className="text-xs text-slate-500">Registro de entrada, break y salida</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => actionMutation.mutate('start')} disabled={!!mySession}>
            Iniciar
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => actionMutation.mutate('break_start')}
            disabled={!mySession || mySession.status !== 'ACTIVE'}
          >
            Break
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => actionMutation.mutate('break_end')}
            disabled={!mySession || mySession.status !== 'BREAK'}
          >
            Volver
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => actionMutation.mutate('end')}
            disabled={!mySession}
          >
            Finalizar
          </Button>
        </div>
      </div>

      {errorMessage && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
          {errorMessage}
        </div>
      )}

      <div className="flex items-center gap-3 text-xs text-slate-600">
        <Badge className="alef-chip px-3 py-1 text-xs">
          {mySession ? `Tu estado: ${mySession.status === 'ACTIVE' ? 'Activo' : 'Break'}` : 'Sin sesión activa'}
        </Badge>
        {mySession && (
          <span className="font-mono text-slate-700">Tiempo activo: {formatDuration(elapsedMs)}</span>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {activeSessions.length === 0 && (
          <div className="text-sm text-slate-500">Sin usuarios activos</div>
        )}
        {activeSessions.map((session) => (
          <Badge key={session.id} className="alef-chip px-3 py-1 text-xs">
            {session.user.name || session.user.email} · {session.status === 'ACTIVE' ? 'Activo' : 'Break'}
          </Badge>
        ))}
      </div>

      <div className="flex items-center justify-between pt-2">
        <h4 className="text-xs font-semibold text-slate-600">Historial reciente</h4>
        <Button
          size="sm"
          variant="outline"
          onClick={async () => {
            const res = await fetch('/api/work-sessions/export');
            if (!res.ok) return;
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `horarios-${format(new Date(), 'yyyy-MM-dd')}.csv`;
            a.click();
            URL.revokeObjectURL(url);
          }}
        >
          Exportar CSV
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border border-blue-100 bg-white">
        <div className="grid grid-cols-5 bg-blue-50/60 text-xs font-semibold text-slate-600">
          <div className="px-3 py-2">Usuario</div>
          <div className="px-3 py-2">Inicio</div>
          <div className="px-3 py-2">Break</div>
          <div className="px-3 py-2">Retorno</div>
          <div className="px-3 py-2">Fin</div>
        </div>
        <div className="divide-y divide-blue-100 text-xs text-slate-600">
          {recentSessions.length === 0 && (
            <div className="px-3 py-3 text-slate-500">Sin registros todavía</div>
          )}
          {recentSessions.map((session) => (
            <div key={session.id} className="grid grid-cols-5 px-3 py-2">
              <div className="text-slate-900">{session.user.name || session.user.email}</div>
              <div>{format(new Date(session.startedAt), 'dd/MM HH:mm')}</div>
              <div>{session.breakStart ? format(new Date(session.breakStart), 'HH:mm') : '-'}</div>
              <div>{session.breakEnd ? format(new Date(session.breakEnd), 'HH:mm') : '-'}</div>
              <div>{session.endedAt ? format(new Date(session.endedAt), 'HH:mm') : '-'}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
