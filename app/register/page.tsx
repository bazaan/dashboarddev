\'use client\';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const formData = new FormData(e.currentTarget);
    const name = String(formData.get('name') || '');
    const email = String(formData.get('email') || '');
    const password = String(formData.get('password') || '');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'No se pudo registrar');
      }

      setSuccess('Cuenta creada. Un ADMIN debe aprobarla antes de ingresar.');
      setTimeout(() => router.push('/login'), 1200);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al registrar';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="w-full max-w-md space-y-8 p-8 bg-white rounded-xl shadow-lg border border-slate-100">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Crear cuenta</h1>
          <p className="mt-2 text-sm text-slate-600">Acceso sujeto a aprobación ADMIN</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          {error && (
            <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md border border-red-100">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 text-sm text-emerald-600 bg-emerald-50 rounded-md border border-emerald-100">
              {success}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium leading-none" htmlFor="name">
              Nombre completo
            </label>
            <Input id="name" name="name" type="text" required disabled={loading} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium leading-none" htmlFor="email">
              Email
            </label>
            <Input id="email" name="email" type="email" required disabled={loading} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium leading-none" htmlFor="password">
              Contraseña
            </label>
            <Input id="password" name="password" type="password" minLength={8} required disabled={loading} />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Crear cuenta
          </Button>

          <button
            type="button"
            onClick={() => router.push('/login')}
            className="w-full text-sm text-slate-600 hover:text-slate-900"
            disabled={loading}
          >
            Volver a login
          </button>
        </form>
      </div>
    </div>
  );
}
