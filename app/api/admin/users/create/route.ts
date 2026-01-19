import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2).max(100),
  role: z.enum(['ADMIN', 'DEVELOPER']).optional(),
  status: z.enum(['PENDING', 'ACTIVE', 'BLOCKED']).optional(),
});

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: authData } = await supabase.auth.getUser();
    const adminRole = authData.user?.user_metadata?.role;
    const adminStatus = authData.user?.user_metadata?.status;

    if (!authData.user || adminRole !== 'ADMIN' || adminStatus !== 'ACTIVE') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const payload = createUserSchema.parse(await req.json());

    const supabaseAdmin = createSupabaseAdminClient();
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: payload.email,
      password: payload.password,
      email_confirm: true,
      user_metadata: {
        role: payload.role ?? 'DEVELOPER',
        status: payload.status ?? 'PENDING',
        name: payload.name,
      },
    });

    if (error || !data.user) {
      return NextResponse.json({ error: error?.message || 'No se pudo crear el usuario' }, { status: 400 });
    }

    await prisma.user.create({
      data: {
        id: data.user.id,
        email: payload.email,
        passwordHash: 'SUPABASE_AUTH',
        name: payload.name,
        role: payload.role ?? 'DEVELOPER',
        status: payload.status ?? 'PENDING',
        approvedAt: payload.status === 'ACTIVE' ? new Date() : null,
        approvedById: payload.status === 'ACTIVE' ? authData.user.id : null,
      },
    });

    return NextResponse.json({ message: 'Usuario creado' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al crear usuario';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
