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
                console.log('[LOGIN] Haciendo petición a /api/auth/login...');
                res = await fetch('/api/auth/login', {
                    method: 'POST',
                    body: JSON.stringify({ email, password }),
                    headers: { 'Content-Type': 'application/json' },
                    signal: controller.signal,
                    credentials: 'include', // Importante para cookies
                });
                clearTimeout(timeoutId);
                console.log('[LOGIN] Respuesta recibida, status:', res.status, 'ok:', res.ok);
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

            console.log('[LOGIN] Login exitoso, verificando cookies...');
            
            // Las cookies httpOnly no son accesibles desde JavaScript por seguridad
            // Verificar headers de respuesta para debugging
            const setCookieHeader = res.headers.get('set-cookie');
            console.log('[LOGIN] Set-Cookie header:', setCookieHeader ? 'Presente' : 'No presente');
            if (setCookieHeader) {
                console.log('[LOGIN] Set-Cookie contenido:', setCookieHeader.substring(0, 300));
            }
            
            // CRÍTICO: Hacer una petición de verificación para asegurar que las cookies estén establecidas
            // antes de redirigir. Esto fuerza al navegador a procesar las cookies.
            console.log('[LOGIN] Verificando que las cookies estén establecidas...');
            let cookiesVerified = false;
            
            try {
                // Esperar un momento para que el navegador procese las cookies
                await new Promise(resolve => setTimeout(resolve, 500));
                
                const verifyRes = await fetch('/api/auth/verify', {
                    method: 'GET',
                    credentials: 'include',
                });
                
                console.log('[LOGIN] Verificación respuesta status:', verifyRes.status);
                
                if (verifyRes.ok) {
                    const verifyData = await verifyRes.json();
                    console.log('[LOGIN] Verificación exitosa:', verifyData);
                    if (verifyData.authenticated) {
                        cookiesVerified = true;
                        console.log('[LOGIN] Cookies confirmadas, redirigiendo...');
                    } else {
                        console.warn('[LOGIN] Verificación OK pero no autenticado:', verifyData);
                    }
                } else {
                    const errorText = await verifyRes.text();
                    console.warn('[LOGIN] Verificación falló con status:', verifyRes.status, 'error:', errorText);
                }
            } catch (verifyError) {
                console.error('[LOGIN] Error en verificación:', verifyError);
            }
            
            // Si las cookies están verificadas, redirigir inmediatamente
            if (cookiesVerified) {
                console.log('[LOGIN] Redirigiendo con router.push...');
                router.push('/dashboard');
                // También usar window.location como respaldo después de un delay
                setTimeout(() => {
                    if (window.location.pathname === '/login') {
                        console.log('[LOGIN] Router.push no funcionó, usando window.location...');
                        window.location.href = '/dashboard';
                    }
                }, 1000);
            } else {
                // Si no se verificaron, esperar más y usar window.location
                console.log('[LOGIN] Cookies no verificadas, esperando 2 segundos antes de redirigir...');
                await new Promise(resolve => setTimeout(resolve, 2000));
                console.log('[LOGIN] Redirigiendo a /dashboard con window.location...');
                window.location.href = '/dashboard';
            }
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
