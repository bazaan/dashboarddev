import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';

type PendingUser = {
  id: string;
  email: string;
  name?: string | null;
  createdAt: string;
};

export function AdminPanel() {
  const queryClient = useQueryClient();
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementBody, setAnnouncementBody] = useState('');
  const [awardEmail, setAwardEmail] = useState('');
  const [awardStars, setAwardStars] = useState(1);
  const [awardReason, setAwardReason] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'ADMIN' | 'DEVELOPER'>('DEVELOPER');
  const [newUserStatus, setNewUserStatus] = useState<'PENDING' | 'ACTIVE' | 'BLOCKED'>('PENDING');

  const { data: pendingUsers } = useQuery<PendingUser[]>({
    queryKey: ['admin', 'pendingUsers'],
    queryFn: async () => {
      const res = await fetch('/api/admin/users');
      if (!res.ok) throw new Error('Failed to fetch pending users');
      return res.json();
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch('/api/admin/users/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'No se pudo aprobar');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'pendingUsers'] });
    },
  });

  const announcementMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: announcementTitle, body: announcementBody }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'No se pudo enviar anuncio');
      }
      return res.json();
    },
    onSuccess: () => {
      setAnnouncementTitle('');
      setAnnouncementBody('');
    },
  });

  const awardMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/admin/stars/award', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: awardEmail, stars: awardStars, reason: awardReason }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'No se pudo asignar estrellas');
      }
      return res.json();
    },
    onSuccess: () => {
      setAwardEmail('');
      setAwardReason('');
      setAwardStars(1);
      queryClient.invalidateQueries({ queryKey: ['summary'] });
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/admin/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newUserEmail,
          password: newUserPassword,
          name: newUserName,
          role: newUserRole,
          status: newUserStatus,
        }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'No se pudo crear el usuario');
      }
      return res.json();
    },
    onSuccess: () => {
      setNewUserEmail('');
      setNewUserName('');
      setNewUserPassword('');
      setNewUserRole('DEVELOPER');
      setNewUserStatus('PENDING');
      queryClient.invalidateQueries({ queryKey: ['admin', 'pendingUsers'] });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Panel ADMIN</h2>
        <p className="text-sm text-slate-500">Supervisión total y control de rendimiento</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="alef-card p-4">
          <h3 className="text-sm font-semibold text-slate-900">Usuarios pendientes</h3>
          <p className="mt-2 text-sm text-slate-500">Aprueba nuevas cuentas</p>
          <div className="mt-4 space-y-2">
            {pendingUsers?.map((user) => (
              <div key={user.id} className="flex items-center justify-between rounded-lg border border-blue-100 bg-blue-50/50 p-2">
                <div>
                  <p className="text-sm font-medium text-slate-900">{user.name || user.email}</p>
                  <p className="text-xs text-slate-500">{user.email}</p>
                </div>
                <Button size="sm" onClick={() => approveMutation.mutate(user.id)}>
                  Aprobar
                </Button>
              </div>
            ))}
            {pendingUsers?.length === 0 && (
              <div className="text-sm text-slate-500">Sin usuarios pendientes</div>
            )}
          </div>
        </div>
        <div className="alef-card p-4">
          <h3 className="text-sm font-semibold text-slate-900">Agregar usuario</h3>
          <p className="mt-2 text-sm text-slate-500">Crea cuentas manualmente</p>
          <div className="mt-4 space-y-2">
            <Input
              placeholder="Nombre"
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
            />
            <Input
              placeholder="Email"
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
            />
            <Input
              placeholder="Contraseña (mín 8)"
              type="password"
              value={newUserPassword}
              onChange={(e) => setNewUserPassword(e.target.value)}
            />
            <Select value={newUserRole} onChange={(e) => setNewUserRole(e.target.value as 'ADMIN' | 'DEVELOPER')}>
              <option value="DEVELOPER">Developer</option>
              <option value="ADMIN">Admin</option>
            </Select>
            <Select value={newUserStatus} onChange={(e) => setNewUserStatus(e.target.value as 'PENDING' | 'ACTIVE' | 'BLOCKED')}>
              <option value="PENDING">Pendiente</option>
              <option value="ACTIVE">Activo</option>
              <option value="BLOCKED">Bloqueado</option>
            </Select>
            <Button
              onClick={() => createUserMutation.mutate()}
              disabled={!newUserEmail || !newUserName || newUserPassword.length < 8}
            >
              Crear usuario
            </Button>
          </div>
        </div>
        <div className="alef-card p-4">
          <h3 className="text-sm font-semibold text-slate-900">Bonificaciones</h3>
          <p className="mt-2 text-sm text-slate-500">Define perks y activaciones</p>
          <div className="mt-4 space-y-2">
            <Input
              placeholder="Email del desarrollador"
              value={awardEmail}
              onChange={(e) => setAwardEmail(e.target.value)}
            />
            <Select value={String(awardStars)} onChange={(e) => setAwardStars(Number(e.target.value))}>
              <option value="1">1 ⭐ (Bajo)</option>
              <option value="2">2 ⭐ (Medio)</option>
              <option value="3">3 ⭐ (Alto)</option>
            </Select>
            <Input
              placeholder="Motivo (opcional)"
              value={awardReason}
              onChange={(e) => setAwardReason(e.target.value)}
            />
            <Button onClick={() => awardMutation.mutate()} disabled={!awardEmail}>
              Asignar estrellas
            </Button>
          </div>
        </div>
        <div className="alef-card p-4">
          <h3 className="text-sm font-semibold text-slate-900">Rendimiento por equipo</h3>
          <p className="mt-2 text-sm text-slate-500">Métricas por desarrollador y proyecto</p>
          <Button className="mt-4" variant="outline">Ver métricas</Button>
        </div>
        <div className="alef-card p-4">
          <h3 className="text-sm font-semibold text-slate-900">Logs y auditoría</h3>
          <p className="mt-2 text-sm text-slate-500">Cambios críticos del sistema</p>
          <div className="mt-4 space-y-2">
            <Input
              placeholder="Título del anuncio"
              value={announcementTitle}
              onChange={(e) => setAnnouncementTitle(e.target.value)}
            />
            <Textarea
              rows={3}
              placeholder="Mensaje global para el equipo"
              value={announcementBody}
              onChange={(e) => setAnnouncementBody(e.target.value)}
            />
            <Button onClick={() => announcementMutation.mutate()} disabled={!announcementTitle || !announcementBody}>
              Enviar anuncio global
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
