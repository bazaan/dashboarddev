import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const createNoteSchema = z.object({
  title: z.string().min(2),
  content: z.string().min(2),
  scope: z.enum(['PERSONAL', 'PROJECT', 'SHARED']).optional(),
  projectId: z.string().optional(),
});

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const notes = await prisma.note.findMany({
      where: {
        OR: [
          { authorId: data.user.id },
          { scope: 'SHARED' },
        ],
      },
      orderBy: { updatedAt: 'desc' },
      take: 20,
    });

    return NextResponse.json(notes);
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
    const payload = createNoteSchema.parse(body);

    const note = await prisma.note.create({
      data: {
        title: payload.title,
        content: payload.content,
        scope: payload.scope ?? 'PERSONAL',
        projectId: payload.projectId || null,
        authorId: data.user.id,
      },
    });

    return NextResponse.json(note);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create note';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
