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
        
        // Obtener el hostname de la petición
        const hostname = req.headers.get('host') || '';
        const isSecure = isProduction || hostname.includes('netlify.app');
        
        console.log('[LOGIN API] Configurando cookies - secure:', isSecure, 'production:', isProduction, 'hostname:', hostname);

        // Crear respuesta JSON primero
        const response = NextResponse.json({
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                name: user.name,
            },
        }, { 
            status: 200,
        });

        // Configurar cookies usando el método de Next.js (más confiable)
        // IMPORTANTE: establecer las cookies ANTES de retornar la respuesta
        // En Netlify, puede ser necesario usar sameSite: 'none' con secure: true
        // Probamos primero con 'lax', si no funciona, cambiar a 'none'
        const sameSiteValue = isSecure ? ('lax' as const) : ('lax' as const);
        
        response.cookies.set('accessToken', accessToken, {
            httpOnly: true,
            secure: isSecure, // Siempre true en producción (Netlify usa HTTPS)
            sameSite: sameSiteValue,
            maxAge: 15 * 60, // 15 mins
            path: '/',
        });

        response.cookies.set('refreshToken', refreshToken, {
            httpOnly: true,
            secure: isSecure, // Siempre true en producción (Netlify usa HTTPS)
            sameSite: sameSiteValue,
            maxAge: 7 * 24 * 60 * 60, // 7 days
            path: '/',
        });

        // Verificar que las cookies se establecieron correctamente
        const setCookieHeader = response.headers.get('Set-Cookie');
        console.log('[LOGIN API] Set-Cookie header después de configurar:', setCookieHeader ? 'Presente' : 'NO PRESENTE');
        
        if (setCookieHeader) {
            console.log('[LOGIN API] Contenido Set-Cookie:', setCookieHeader.substring(0, 200));
        } else {
            console.error('[LOGIN API] ERROR: Set-Cookie header no se estableció!');
        }

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
