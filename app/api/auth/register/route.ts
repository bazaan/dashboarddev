import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2).max(100),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, name } = registerSchema.parse(body);

    const supabaseAdmin = createSupabaseAdminClient();
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role: 'DEVELOPER',
        status: 'PENDING',
        name,
      },
    });

    if (error || !data.user) {
      return NextResponse.json({ error: error?.message || 'No se pudo crear el usuario' }, { status: 400 });
    }

    await prisma.user.create({
      data: {
        id: data.user.id,
        email,
        passwordHash: 'SUPABASE_AUTH',
        name,
        role: 'DEVELOPER',
        status: 'PENDING',
      },
    });

    return NextResponse.json({
      message: 'Cuenta creada. Un ADMIN debe aprobarla antes de ingresar.',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al registrar';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
