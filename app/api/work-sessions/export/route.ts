import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSupabaseServerClient } from '@/lib/supabase/server';

function escapeCsv(value: string) {
  if (value.includes('"') || value.includes(',') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const role = data.user.user_metadata?.role || 'DEVELOPER';
    const sessions = await prisma.workSession.findMany({
      where: role === 'ADMIN' ? {} : { userId: data.user.id },
      orderBy: { startedAt: 'desc' },
      take: 500,
      include: { user: { select: { name: true, email: true } } },
    });

    const rows = [
      ['Usuario', 'Email', 'Estado', 'Inicio', 'Break inicio', 'Break fin', 'Fin'],
      ...sessions.map((s) => [
        s.user.name || '',
        s.user.email,
        s.status,
        s.startedAt.toISOString(),
        s.breakStart ? s.breakStart.toISOString() : '',
        s.breakEnd ? s.breakEnd.toISOString() : '',
        s.endedAt ? s.endedAt.toISOString() : '',
      ]),
    ];

    const csv = rows.map((row) => row.map((cell) => escapeCsv(String(cell))).join(',')).join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="work-sessions.csv"',
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to export';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
