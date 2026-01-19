import { NextResponse } from 'next/server';
import { ProjectService } from '@/lib/services/project.service';
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

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = await getAuth();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        const project = await ProjectService.getById(id);

        if (!project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        return NextResponse.json(project);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = await getAuth();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        const body = await req.json();

        const project = await ProjectService.update(id, body, user.userId as string, user.role as string);

        await AuditService.log(
            user.userId as string,
            AuditAction.UPDATE,
            'PROJECT',
            project.id,
            { changes: body }
        );

        return NextResponse.json(project);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to update project';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = await getAuth();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;

        await ProjectService.delete(id, user.userId as string, user.role as string);

        await AuditService.log(
            user.userId as string,
            AuditAction.DELETE,
            'PROJECT',
            id,
            {}
        );

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to delete project';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
