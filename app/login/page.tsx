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
            console.log('[LOGIN] Iniciando login para:', email);
            
            // Crear un AbortController para timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos timeout

            let res;
            try {
                res = await fetch('/api/auth/login', {
                    method: 'POST',
                    body: JSON.stringify({ email, password }),
                    headers: { 'Content-Type': 'application/json' },
                    signal: controller.signal,
                    credentials: 'include', // Importante para cookies
                });
                clearTimeout(timeoutId);
            } catch (fetchError: unknown) {
                clearTimeout(timeoutId);
                console.error('[LOGIN] Error en fetch:', fetchError);
                if (fetchError instanceof Error && fetchError.name === 'AbortError') {
                    throw new Error('La solicitud tardó demasiado. Verifica tu conexión o la configuración del servidor.');
                }
                throw new Error('Error de conexión. Verifica que el servidor esté funcionando.');
            }

            console.log('[LOGIN] Respuesta recibida, status:', res.status);

            // Intentar parsear la respuesta
            let data;
            try {
                const text = await res.text();
                console.log('[LOGIN] Respuesta texto:', text.substring(0, 200));
                if (!text) {
                    throw new Error('Respuesta vacía del servidor');
                }
                data = JSON.parse(text);
            } catch (parseError) {
                console.error('[LOGIN] Error parsing response:', parseError);
                throw new Error(`Error del servidor (${res.status}): ${res.statusText || 'Sin respuesta'}`);
            }

            if (!res.ok) {
                console.error('[LOGIN] Error en respuesta:', data);
                throw new Error(data.error || `Error ${res.status}: ${res.statusText || 'Error desconocido'}`);
            }

            console.log('[LOGIN] Login exitoso, redirigiendo...');
            
            // Verificar que las cookies se establecieron
            const cookiesSet = document.cookie.includes('accessToken') || res.headers.get('set-cookie');
            console.log('[LOGIN] Cookies establecidas:', cookiesSet);

            // Successful login - esperar un momento antes de redirigir
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Usar window.location para asegurar que la redirección funcione
            window.location.href = '/dashboard';
        } catch (err: unknown) {
            console.error('[LOGIN] Error completo:', err);
            const message = err instanceof Error ? err.message : 'Error al iniciar sesión. Verifica tus credenciales y la conexión.';
            setError(message);
        } finally {
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
                        <Input 
                            id="email" 
                            name="email" 
                            type="email" 
                            placeholder="admin@alef.com" 
                            autoComplete="email"
                            required 
                            disabled={loading} 
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="password">
                            Password
                        </label>
                        <Input 
                            id="password" 
                            name="password" 
                            type="password" 
                            autoComplete="current-password"
                            required 
                            disabled={loading} 
                        />
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
