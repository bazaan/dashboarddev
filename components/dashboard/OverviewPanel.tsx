import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { WorkSessionPanel } from './WorkSessionPanel';

type SummaryResponse = {
  summary: {
    weeklyTasks: number;
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    starsBalance: number;
    bonusesBalance: number;
  };
  briefings: { id: string; title: string; startDate: string; endDate: string }[];
  notifications: { id: string; title: string; body: string; level: string; createdAt: string }[];
};

export function OverviewPanel() {
  const { data } = useQuery<SummaryResponse>({
    queryKey: ['summary'],
    queryFn: async () => {
      const res = await fetch('/api/summary');
      if (!res.ok) throw new Error('Failed to load summary');
      return res.json();
    },
  });

  const summary = data?.summary;
  const briefings = data?.briefings ?? [];
  const notifications = data?.notifications ?? [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="alef-card p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Resumen semanal</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{summary?.weeklyTasks ?? 0} tareas</p>
          <p className="mt-1 text-sm text-slate-500">
            {summary?.completedTasks ?? 0} completadas · {summary?.inProgressTasks ?? 0} en progreso
          </p>
        </div>
        <div className="alef-card p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Progreso general</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {summary ? Math.round((summary.completedTasks / Math.max(1, summary.totalTasks)) * 100) : 0}%
          </p>
          <p className="mt-1 text-sm text-slate-500">Roadmap y entregas activas</p>
        </div>
        <div className="alef-card p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Estrellas</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{summary?.starsBalance ?? 0} ⭐</p>
          <p className="mt-1 text-sm text-slate-500">
            {Math.max(0, 3 - ((summary?.starsBalance ?? 0) % 3))} para próxima bonificación
          </p>
        </div>
        <div className="alef-card p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Bonificaciones</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{summary?.bonusesBalance ?? 0} activas</p>
          <p className="mt-1 text-sm text-slate-500">Perks y beneficios en curso</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="alef-card p-4 lg:col-span-2">
          <h3 className="text-sm font-semibold text-slate-900">Próximos briefings</h3>
          <div className="mt-3 space-y-3">
            {briefings.length === 0 && (
              <div className="text-sm text-slate-500">No hay eventos próximos</div>
            )}
            {briefings.map((event) => (
              <div key={event.id} className="flex items-center justify-between rounded-lg bg-blue-50/60 p-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">{event.title}</p>
                  <p className="text-xs text-slate-500">
                    {format(new Date(event.startDate), 'dd MMM · HH:mm')}
                  </p>
                </div>
                <span className="text-xs text-blue-700">Briefing</span>
              </div>
            ))}
          </div>
        </div>
        <div className="alef-card p-4">
          <h3 className="text-sm font-semibold text-slate-900">Notificaciones ADMIN</h3>
          <div className="mt-3 space-y-3">
            {notifications.length === 0 && (
              <div className="text-sm text-slate-500">Sin notificaciones</div>
            )}
            {notifications.map((note) => (
              <div key={note.id} className="rounded-lg border border-blue-100 bg-blue-50/60 p-3 text-xs text-slate-700">
                <p className="font-semibold text-slate-900">{note.title}</p>
                <p className="mt-1">{note.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <WorkSessionPanel />
    </div>
  );
}
