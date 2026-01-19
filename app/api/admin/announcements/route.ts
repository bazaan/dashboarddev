import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const announcementSchema = z.object({
  title: z.string().min(2),
  body: z.string().min(2),
});

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    const role = data.user?.user_metadata?.role;
    const status = data.user?.user_metadata?.status;

    if (!data.user || role !== 'ADMIN' || status !== 'ACTIVE') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const payload = announcementSchema.parse(await req.json());

    const users = await prisma.user.findMany({ select: { id: true } });
    await prisma.notification.createMany({
      data: users.map((user) => ({
        userId: user.id,
        title: payload.title,
        body: payload.body,
        level: 'INFO',
      })),
    });

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to send announcement';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
