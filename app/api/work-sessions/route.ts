import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const actionSchema = z.object({
  action: z.enum(['start', 'break_start', 'break_end', 'end']),
});

async function resolveAppUserId(user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> }) {
  const existingById = await prisma.user.findUnique({ where: { id: user.id } });
  if (existingById) return existingById.id;

  const email = user.email || '';
  if (email) {
    const existingByEmail = await prisma.user.findUnique({ where: { email } });
    if (existingByEmail) return existingByEmail.id;
  }

  const name = typeof user.user_metadata?.name === 'string' ? user.user_metadata?.name : null;
  const role = user.user_metadata?.role === 'ADMIN' ? 'ADMIN' : 'DEVELOPER';
  const status = user.user_metadata?.status === 'ACTIVE' ? 'ACTIVE' : 'PENDING';

  const created = await prisma.user.create({
    data: {
      id: user.id,
      email: email || `${user.id}@alef.local`,
      passwordHash: 'SUPABASE_AUTH',
      name,
      role,
      status,
    },
  });

  return created.id;
}

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const currentUserId = await resolveAppUserId(data.user);
    const role = data.user.user_metadata?.role || 'DEVELOPER';
    const sessions = await prisma.workSession.findMany({
      where: role === 'ADMIN' ? {} : { userId: currentUserId },
      orderBy: { startedAt: 'desc' },
      take: 30,
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    return NextResponse.json({ sessions, currentUserId });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = actionSchema.parse(await req.json());
    const userId = await resolveAppUserId(data.user);

    const activeSession = await prisma.workSession.findFirst({
      where: { userId, status: { in: ['ACTIVE', 'BREAK'] } },
      orderBy: { startedAt: 'desc' },
    });

    if (payload.action === 'start') {
      if (activeSession) return NextResponse.json(activeSession);
      const session = await prisma.workSession.create({
        data: { userId, status: 'ACTIVE' },
      });
      return NextResponse.json(session);
    }

    if (!activeSession) {
      return NextResponse.json({ error: 'No hay sesión activa' }, { status: 400 });
    }

    if (payload.action === 'break_start') {
      const session = await prisma.workSession.update({
        where: { id: activeSession.id },
        data: {
          status: 'BREAK',
          breakStart: activeSession.breakStart ?? new Date(),
        },
      });
      return NextResponse.json(session);
    }

    if (payload.action === 'break_end') {
      const session = await prisma.workSession.update({
        where: { id: activeSession.id },
        data: {
          status: 'ACTIVE',
          breakEnd: new Date(),
        },
      });
      return NextResponse.json(session);
    }

    const session = await prisma.workSession.update({
      where: { id: activeSession.id },
      data: {
        status: 'ENDED',
        endedAt: new Date(),
      },
    });
    return NextResponse.json(session);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update work session';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
