import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = data.user.id;
    const role = data.user.user_metadata?.role || 'DEVELOPER';

    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);
    endOfWeek.setHours(23, 59, 59, 999);

    const baseTaskWhere = role === 'ADMIN' ? {} : { assigneeId: userId };

    const [totalTasks, completedTasks, inProgressTasks, weeklyTasks] = await Promise.all([
      prisma.task.count({ where: baseTaskWhere }),
      prisma.task.count({ where: { ...baseTaskWhere, status: 'DONE' } }),
      prisma.task.count({ where: { ...baseTaskWhere, status: 'IN_PROGRESS' } }),
      prisma.task.count({
        where: {
          ...baseTaskWhere,
          deadline: { gte: startOfWeek, lte: endOfWeek },
        },
      }),
    ]);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { starsBalance: true, bonusesBalance: true },
    });

    const briefings = await prisma.event.findMany({
      where: { startDate: { gte: now } },
      orderBy: { startDate: 'asc' },
      take: 3,
      select: {
        id: true,
        title: true,
        startDate: true,
        endDate: true,
      },
    });

    const notifications = await prisma.notification.findMany({
      where: role === 'ADMIN' ? {} : { userId },
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: { id: true, title: true, body: true, level: true, createdAt: true },
    });

    return NextResponse.json({
      summary: {
        weeklyTasks,
        totalTasks,
        completedTasks,
        inProgressTasks,
        starsBalance: user?.starsBalance ?? 0,
        bonusesBalance: user?.bonusesBalance ?? 0,
      },
      briefings,
      notifications,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
