import { NextResponse } from 'next/server';
import { AuthService } from '@/lib/services/auth.service';
import { z } from 'zod';
import { cookies } from 'next/headers';

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email, password } = loginSchema.parse(body);

        const { user, accessToken, refreshToken } = await AuthService.login(email, password);

        const cookieStore = await cookies();

        cookieStore.set('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax', // Cambiado de 'strict' a 'lax' para mejor compatibilidad
            maxAge: 15 * 60, // 15 mins
            path: '/',
        });

        cookieStore.set('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax', // Cambiado de 'strict' a 'lax' para mejor compatibilidad
            maxAge: 7 * 24 * 60 * 60, // 7 days
            path: '/',
        });

        return NextResponse.json({
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                name: user.name,
            },
        });
    } catch (error: unknown) {
        console.error('Login API error:', error);
        
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
