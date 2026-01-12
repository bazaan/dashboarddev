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
    if (path === '/login' || path.startsWith('/api/auth') || path.startsWith('/api/test')) {
        return NextResponse.next();
    }

    // Verificar token de acceso
    const accessToken = request.cookies.get('accessToken')?.value;
    const allCookies = request.cookies.getAll();
    
    console.log('[MIDDLEWARE] Path:', path);
    console.log('[MIDDLEWARE] Cookies disponibles:', allCookies.map(c => c.name).join(', '));
    console.log('[MIDDLEWARE] AccessToken presente:', !!accessToken);

    if (!accessToken) {
        console.log('[MIDDLEWARE] No access token encontrado, redirigiendo a login');
        // Solo redirigir si no es una petición de API
        if (path.startsWith('/api/')) {
            return NextResponse.json(
                { error: 'No autorizado' },
                { status: 401 }
            );
        }
        return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
        const payload = await verifyAccessToken(accessToken);

        if (!payload) {
            console.log('[MIDDLEWARE] Token inválido, redirigiendo a login');
            // Solo redirigir si no es una petición de API
            if (path.startsWith('/api/')) {
                return NextResponse.json(
                    { error: 'Token inválido' },
                    { status: 401 }
                );
            }
            return NextResponse.redirect(new URL('/login', request.url));
        }

        // Admin protection
        if (path.startsWith('/admin')) {
            if (payload.role !== 'ADMIN') {
                console.log('[MIDDLEWARE] Usuario no admin intentando acceder a admin');
                return NextResponse.redirect(new URL('/dashboard', request.url));
            }
        }

        return NextResponse.next();
    } catch (error) {
        console.error('[MIDDLEWARE] Error verificando token:', error);
        if (path.startsWith('/api/')) {
            return NextResponse.json(
                { error: 'Error de autenticación' },
                { status: 401 }
            );
        }
        return NextResponse.redirect(new URL('/login', request.url));
    }
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
