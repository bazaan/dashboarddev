import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const createReportSchema = z.object({
  title: z.string().min(2),
  body: z.string().min(2),
  type: z.enum(['DAILY', 'WEEKLY']).optional(),
});

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const role = data.user.user_metadata?.role || 'DEVELOPER';

    const reports = await prisma.report.findMany({
      where: role === 'ADMIN' ? {} : { authorId: data.user.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        author: { select: { id: true, name: true, email: true } },
        comments: {
          orderBy: { createdAt: 'desc' },
          take: 3,
          include: { author: { select: { id: true, name: true } } },
        },
      },
    });

    return NextResponse.json(reports);
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

    const body = await req.json();
    const payload = createReportSchema.parse(body);

    const report = await prisma.report.create({
      data: {
        title: payload.title,
        body: payload.body,
        type: payload.type ?? 'DAILY',
        authorId: data.user.id,
      },
    });

    return NextResponse.json(report);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create report';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
