import { NextResponse } from 'next/server';
import { EventService } from '@/lib/services/event.service';
import { verifyAccessToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { AuditService } from '@/lib/services/audit.service';
import { AuditAction } from '@prisma/client';

async function getAuth(req: Request) {
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    if (!token) return null;
    return await verifyAccessToken(token);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = await getAuth(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        const body = await req.json();

        const event = await EventService.update(id, body, user.userId as string, user.role as string);

        await AuditService.log(
            user.userId as string,
            AuditAction.UPDATE,
            'EVENT',
            event.id,
            { changes: body }
        );

        return NextResponse.json(event);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to update event';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = await getAuth(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;

        await EventService.delete(id, user.userId as string, user.role as string);

        await AuditService.log(
            user.userId as string,
            AuditAction.DELETE,
            'EVENT',
            id,
            {}
        );

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to delete event';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
