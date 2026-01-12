import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/lib/auth';

export async function GET() {
    try {
        const cookieStore = await cookies();
        const accessToken = cookieStore.get('accessToken')?.value;
        
        console.log('[VERIFY API] Verificando cookies...');
        console.log('[VERIFY API] AccessToken presente:', !!accessToken);
        
        const allCookies = cookieStore.getAll();
        console.log('[VERIFY API] Todas las cookies:', allCookies.map(c => c.name).join(', '));
        
        if (!accessToken) {
            return NextResponse.json({
                authenticated: false,
                message: 'No access token found',
                cookies: allCookies.map(c => ({ name: c.name, hasValue: !!c.value })),
            }, { status: 401 });
        }
        
        const payload = await verifyAccessToken(accessToken);
        
        if (!payload) {
            return NextResponse.json({
                authenticated: false,
                message: 'Invalid token',
            }, { status: 401 });
        }
        
        return NextResponse.json({
            authenticated: true,
            user: {
                userId: payload.userId,
                email: payload.email,
                role: payload.role,
            },
            cookies: allCookies.map(c => ({ name: c.name, hasValue: !!c.value })),
        });
    } catch (error) {
        console.error('[VERIFY API] Error:', error);
        return NextResponse.json(
            { error: 'Error verifying authentication' },
            { status: 500 }
        );
    }
}
