import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email, password } = loginSchema.parse(body);

        const supabase = await createSupabaseServerClient();
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error || !data.user) {
            return NextResponse.json({ error: error?.message || 'Credenciales inválidas' }, { status: 401 });
        }

        const status = data.user.user_metadata?.status;
        if (status !== 'ACTIVE') {
            await supabase.auth.signOut();
            return NextResponse.json({ error: 'Cuenta pendiente de aprobación' }, { status: 403 });
        }

        return NextResponse.json({
            user: {
                id: data.user.id,
                email: data.user.email,
                role: data.user.user_metadata?.role,
                name: data.user.user_metadata?.name,
            },
        }, { 
            status: 200,
        });
    } catch (error: unknown) {
        // Manejar errores de validación de Zod
        if (error instanceof Error && error.name === 'ZodError') {
            return NextResponse.json(
                { error: 'Email o contraseña inválidos' },
                { status: 400 }
            );
        }

        const message = error instanceof Error ? error.message : 'Error al autenticar';
        return NextResponse.json(
            { error: message },
            { status: 401 }
        );
    }
}
