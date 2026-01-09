import { NextResponse } from 'next/server';
import { TaskService } from '@/lib/services/task.service';
import { verifyAccessToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { z } from 'zod';

const updateOrderSchema = z.object({
    taskIds: z.array(z.string().uuid()),
});

async function getAuth(req: Request) {
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    if (!token) return null;
    return await verifyAccessToken(token);
}

export async function POST(req: Request) {
    try {
        const user = await getAuth(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { taskIds } = updateOrderSchema.parse(body);

        const tasks = await TaskService.updateOrder(taskIds, user.role as string);

        return NextResponse.json(tasks);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to update order';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
