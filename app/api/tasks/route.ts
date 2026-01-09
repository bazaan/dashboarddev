import { NextResponse } from 'next/server';
import { TaskService } from '@/lib/services/task.service';
import { verifyAccessToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { AuditService } from '@/lib/services/audit.service';
import { AuditAction } from '@prisma/client';
import { z } from 'zod';

const createTaskSchema = z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    priority: z.enum(['HIGH', 'MEDIUM', 'LOW']),
    status: z.enum(['NOT_STARTED', 'PENDING', 'IN_PROGRESS', 'DONE']).optional(),
    deadline: z.string().optional(),
    assigneeId: z.string().uuid().optional(),
    projectId: z.string().uuid().optional(),
    recurrenceType: z.enum(['NONE', 'DAILY', 'WEEKLY']).optional(),
    orderIndex: z.number().optional(),
});

async function getAuth(req: Request) {
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    if (!token) return null;
    return await verifyAccessToken(token);
}

export async function GET(req: Request) {
    try {
        const user = await getAuth(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const type = searchParams.get('type'); // 'daily' or 'weekly'
        const date = searchParams.get('date');

        let tasks;

        if (type === 'daily') {
            tasks = await TaskService.getDailyTasks(date ? new Date(date) : undefined);
        } else if (type === 'weekly') {
            tasks = await TaskService.getWeeklyTasks(date ? new Date(date) : undefined);
        } else if (user.role === 'ADMIN') {
            tasks = await TaskService.getAll();
        } else {
            tasks = await TaskService.getMyTasks(user.userId as string);
        }

        return NextResponse.json(tasks);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const user = await getAuth(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const data = createTaskSchema.parse(body);

        const task = await TaskService.create(data, user.userId as string, user.role as string);

        await AuditService.log(
            user.userId as string,
            AuditAction.CREATE,
            'TASK',
            task.id,
            { title: task.title }
        );

        return NextResponse.json(task);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to create task';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
