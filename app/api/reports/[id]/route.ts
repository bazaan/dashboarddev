import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const updateReportSchema = z.object({
  status: z.enum(['OPEN', 'RESOLVED']),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const role = data.user.user_metadata?.role || 'DEVELOPER';
    if (role !== 'ADMIN') {
      return NextResponse.json({ error: 'Solo ADMIN puede resolver reportes' }, { status: 403 });
    }

    const { id } = await params;
    const payload = updateReportSchema.parse(await req.json());

    const report = await prisma.report.update({
      where: { id },
      data: {
        status: payload.status,
        resolverId: payload.status === 'RESOLVED' ? data.user.id : null,
      },
    });

    return NextResponse.json(report);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update report';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
