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
        // Autenticación deshabilitada - obtener todas las tareas
        const { searchParams } = new URL(req.url);
        const type = searchParams.get('type'); // 'daily' or 'weekly'
        const date = searchParams.get('date');

        let tasks;

        if (type === 'daily') {
            tasks = await TaskService.getDailyTasks(date ? new Date(date) : undefined);
        } else if (type === 'weekly') {
            tasks = await TaskService.getWeeklyTasks(date ? new Date(date) : undefined);
        } else {
            // Obtener todas las tareas sin filtro de usuario
            tasks = await TaskService.getAll();
        }

        return NextResponse.json(tasks);
    } catch (error: unknown) {
        console.error('[API TASKS] Error:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        // Autenticación deshabilitada - usar un usuario por defecto
        const body = await req.json();
        const data = createTaskSchema.parse(body);

        // Obtener el primer usuario de la base de datos como owner por defecto
        const { prisma } = await import('@/lib/prisma');
        const defaultUser = await prisma.user.findFirst();
        
        if (!defaultUser) {
            return NextResponse.json({ error: 'No users found in database' }, { status: 500 });
        }

        const task = await TaskService.create(data, defaultUser.id, defaultUser.role);

        await AuditService.log(
            defaultUser.id,
            AuditAction.CREATE,
            'TASK',
            task.id,
            { title: task.title }
        );

        return NextResponse.json(task);
    } catch (error: unknown) {
        console.error('[API TASKS POST] Error:', error);
        const message = error instanceof Error ? error.message : 'Failed to create task';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
