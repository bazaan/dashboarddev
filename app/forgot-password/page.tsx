'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export default function ForgotPasswordPage() {
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
    const email = String(formData.get('email') || '');

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: process.env.NEXT_PUBLIC_SITE_URL
          ? `${process.env.NEXT_PUBLIC_SITE_URL}/login`
          : undefined,
      });

      if (resetError) {
        throw new Error(resetError.message);
      }

      setSuccess('Si el email existe, recibirás un enlace para restablecer tu contraseña.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'No se pudo enviar el email';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="w-full max-w-md space-y-8 p-8 bg-white rounded-xl shadow-lg border border-slate-100">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Recuperar contraseña</h1>
          <p className="mt-2 text-sm text-slate-600">Te enviaremos un enlace de recuperación</p>
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
            <label className="text-sm font-medium leading-none" htmlFor="email">
              Email
            </label>
            <Input id="email" name="email" type="email" required disabled={loading} />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Enviar enlace
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
