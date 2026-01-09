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
            return new NextResponse('Invalid hostname', { status: 403 });
        }
    }

    // Public paths
    if (path === '/login' || path.startsWith('/api/auth')) {
        return NextResponse.next();
    }

    const accessToken = request.cookies.get('accessToken')?.value;

    if (!accessToken) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    const payload = await verifyAccessToken(accessToken);

    if (!payload) {
        // Token invalid -> Redirect to login (Client should try refresh via API)
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // Admin protection
    if (path.startsWith('/admin')) {
        if (payload.role !== 'ADMIN') {
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }
    }

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
