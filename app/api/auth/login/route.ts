import { NextResponse } from 'next/server';
import { AuthService } from '@/lib/services/auth.service';
import { z } from 'zod';

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});

export async function POST(req: Request) {
    try {
        // Verificar variables de entorno críticas
        if (!process.env.DATABASE_URL) {
            console.error('[LOGIN API] DATABASE_URL no está configurada');
            return NextResponse.json(
                { error: 'Configuración del servidor incompleta. DATABASE_URL no está configurada.' },
                { status: 500 }
            );
        }

        if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
            console.error('[LOGIN API] JWT_SECRET o JWT_REFRESH_SECRET no están configurados');
            return NextResponse.json(
                { error: 'Configuración del servidor incompleta. JWT secrets no están configurados.' },
                { status: 500 }
            );
        }

        const body = await req.json();
        console.log('[LOGIN API] Intento de login para:', body.email);
        
        const { email, password } = loginSchema.parse(body);

        const { user, accessToken, refreshToken } = await AuthService.login(email, password);
        
        console.log('[LOGIN API] Login exitoso para:', user.email);

        // Detectar si estamos en producción (Netlify siempre usa HTTPS)
        const isProduction = process.env.NODE_ENV === 'production' || process.env.NETLIFY === 'true';
        
        // Obtener el origen de la petición para configurar cookies correctamente
        const origin = req.headers.get('origin') || req.headers.get('referer') || '';
        const isSecure = isProduction || origin.startsWith('https://');

        // Crear respuesta JSON
        const response = NextResponse.json({
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                name: user.name,
            },
        }, { 
            status: 200,
            headers: {
                'Content-Type': 'application/json',
            }
        });

        // Configurar cookies en la respuesta - IMPORTANTE: establecer antes de enviar
        response.cookies.set('accessToken', accessToken, {
            httpOnly: true,
            secure: isSecure, // true en producción (HTTPS)
            sameSite: 'lax', // Permite cookies en navegación cross-site
            maxAge: 15 * 60, // 15 mins
            path: '/',
            // No especificar domain para que use el dominio actual automáticamente
        });

        response.cookies.set('refreshToken', refreshToken, {
            httpOnly: true,
            secure: isSecure, // true en producción (HTTPS)
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60, // 7 days
            path: '/',
            // No especificar domain para que use el dominio actual automáticamente
        });

        console.log('[LOGIN API] Cookies configuradas - secure:', isSecure, 'production:', isProduction);
        console.log('[LOGIN API] Respuesta enviada con cookies configuradas');
        return response;
    } catch (error: unknown) {
        console.error('[LOGIN API] Error:', error);
        
        // Manejar errores de validación de Zod
        if (error instanceof Error && error.name === 'ZodError') {
            return NextResponse.json(
                { error: 'Email o contraseña inválidos' },
                { status: 400 }
            );
        }

        // Manejar errores de base de datos
        if (error instanceof Error && (error.message.includes('Prisma') || error.message.includes('database'))) {
            return NextResponse.json(
                { error: 'Error de conexión a la base de datos. Verifica la configuración.' },
                { status: 500 }
            );
        }

        const message = error instanceof Error ? error.message : 'Error al autenticar';
        return NextResponse.json(
            { error: message },
            { status: 401 }
        );
    }
}
