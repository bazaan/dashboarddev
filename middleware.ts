import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAccessToken } from './lib/auth';

export async function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname;
    const hostname = request.headers.get('host') || '';

    // Permitir dominios de Netlify, dominio personalizado y localhost
    // Solo validar hostname en producción si se especifica un dominio personalizado
    if (process.env.NODE_ENV === 'production' && process.env.ALLOWED_HOST) {
        const allowedHosts = [process.env.ALLOWED_HOST];
        const isValidHost = allowedHosts.some(host => hostname.includes(host));
        
        // Permitir dominios de Netlify siempre
        const isNetlifyDomain = hostname.includes('.netlify.app') || hostname.includes('netlify');
        
        if (!isValidHost && !isNetlifyDomain && !hostname.includes('localhost')) {
            console.log('[MIDDLEWARE] Hostname no permitido:', hostname);
            return new NextResponse('Invalid hostname', { status: 403 });
        }
    }

    // Public paths - permitir acceso sin autenticación
    // AUTENTICACIÓN DESHABILITADA: Permitir acceso a todas las rutas sin login
    if (path === '/login' || path.startsWith('/api/auth') || path.startsWith('/api/test') || path.startsWith('/dashboard') || path === '/') {
        return NextResponse.next();
    }

    // Para APIs, permitir acceso sin autenticación (opcional: puedes mantener la verificación si lo necesitas)
    if (path.startsWith('/api/')) {
        // Permitir acceso sin autenticación a todas las APIs
        return NextResponse.next();
    }

    // Permitir acceso a todas las demás rutas
    return NextResponse.next();
}

export const config = {
    matcher: [
        '/dashboard/:path*',
        '/admin/:path*',
        '/api/tasks/:path*',
        '/api/users/:path*',
        '/api/events/:path*',
        '/api/projects/:path*'
    ],
};
