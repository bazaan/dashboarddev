import { NextResponse } from 'next/server';
import { TaskService } from '@/lib/services/task.service';
import { AuditService } from '@/lib/services/audit.service';
import { AuditAction } from '@prisma/client';
import { createSupabaseServerClient } from '@/lib/supabase/server';

async function getAuth() {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) return null;
    return {
        userId: data.user.id,
        role: data.user.user_metadata?.role || 'DEVELOPER',
    };
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = await getAuth();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        const body = await req.json();

        const task = await TaskService.update(
            id,
            {
                ...body,
                deadline: body.deadline || undefined,
                projectId: body.projectId || undefined,
                recurrenceType: body.recurrenceType || undefined,
            },
            user.userId as string,
            user.role as string
        );

        await AuditService.log(
            user.userId as string,
            AuditAction.UPDATE,
            'TASK',
            task.id,
            { changes: body }
        );

        return NextResponse.json(task);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to update task';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = await getAuth();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;

        await TaskService.delete(id, user.userId as string, user.role as string);

        await AuditService.log(
            user.userId as string,
            AuditAction.DELETE,
            'TASK',
            id,
            {}
        );

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to delete task';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
