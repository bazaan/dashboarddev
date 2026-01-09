'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setError('');

        const formData = new FormData(e.currentTarget);
        const email = formData.get('email');
        const password = formData.get('password');

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password }),
                headers: { 'Content-Type': 'application/json' },
            });

            // Intentar parsear la respuesta
            let data;
            try {
                data = await res.json();
            } catch (parseError) {
                throw new Error(`Error del servidor (${res.status}): ${res.statusText}`);
            }

            if (!res.ok) {
                throw new Error(data.error || `Error ${res.status}: ${res.statusText}`);
            }

            // Successful login - esperar un momento antes de redirigir
            await new Promise(resolve => setTimeout(resolve, 100));
            router.push('/dashboard');
        } catch (err: unknown) {
            console.error('Login error:', err);
            const message = err instanceof Error ? err.message : 'Error al iniciar sesión. Verifica tus credenciales.';
            setError(message);
            setLoading(false);
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
            <div className="w-full max-w-md space-y-8 p-8 bg-white rounded-xl shadow-lg border border-slate-100">
                <div className="text-center">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">ALEF Dashboard</h1>
                    <p className="mt-2 text-sm text-slate-600">Enter your credentials to access the system</p>
                </div>

                <form onSubmit={onSubmit} className="space-y-6">
                    {error && (
                        <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md border border-red-100">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="email">
                            Email
                        </label>
                        <Input id="email" name="email" type="email" placeholder="admin@alef.com" required disabled={loading} />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="password">
                            Password
                        </label>
                        <Input id="password" name="password" type="password" required disabled={loading} />
                    </div>

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Sign In
                    </Button>
                </form>
            </div>
        </div>
    );
}
