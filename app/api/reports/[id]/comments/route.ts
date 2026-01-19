import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const commentSchema = z.object({
  body: z.string().min(2),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const payload = commentSchema.parse(await req.json());

    const comment = await prisma.reportComment.create({
      data: {
        reportId: id,
        authorId: data.user.id,
        body: payload.body,
      },
    });

    return NextResponse.json(comment);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to add comment';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
