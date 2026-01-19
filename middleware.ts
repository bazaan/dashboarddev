import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

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

    // Public paths
    if (
        path === '/login' ||
        path === '/register' ||
        path === '/forgot-password' ||
        path.startsWith('/api/auth')
    ) {
        return NextResponse.next();
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    if (!supabaseUrl || !supabaseAnonKey) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    const response = NextResponse.next();
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
            getAll() {
                return request.cookies.getAll();
            },
            setAll(cookies) {
                cookies.forEach(({ name, value, options }) => {
                    response.cookies.set({ name, value, ...options });
                });
            },
        },
    });

    const { data } = await supabase.auth.getUser();

    if (!data.user) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // Admin protection
    const status = data.user.user_metadata?.status;
    if (status !== 'ACTIVE') {
        await supabase.auth.signOut();
        return NextResponse.redirect(new URL('/login', request.url));
    }

    if (path.startsWith('/admin')) {
        const role = data.user.user_metadata?.role;
        if (role !== 'ADMIN') {
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }
    }

    return response;
}

export const config = {
    matcher: [
        '/dashboard/:path*',
        '/admin/:path*',
        '/api/admin/:path*',
        '/api/tasks/:path*',
        '/api/users/:path*',
        '/api/events/:path*',
        '/api/projects/:path*',
        '/api/notes/:path*',
        '/api/reports/:path*',
        '/api/summary/:path*',
        '/api/admin/announcements/:path*',
        '/api/admin/stars/:path*',
        '/api/admin/users/create/:path*',
        '/api/work-sessions/:path*',
        '/api/work-sessions/export/:path*'
    ],
};
