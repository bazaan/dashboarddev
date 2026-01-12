import { NextResponse } from 'next/server';
import { EventService } from '@/lib/services/event.service';
import { verifyAccessToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { AuditService } from '@/lib/services/audit.service';
import { AuditAction, EventType } from '@prisma/client';
import { z } from 'zod';

const createEventSchema = z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    type: z.enum(['DEVELOPMENT', 'DELIVERY', 'OTHER']),
    startDate: z.string().min(1), // Accept ISO string or date string
    endDate: z.string().min(1),
    progress: z.number().min(0).max(100).optional(),
    projectId: z.string().uuid().optional().or(z.literal('')),
});

async function getAuth(req: Request) {
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    if (!token) return null;
    return await verifyAccessToken(token);
}

export async function GET(req: Request) {
    try {
        // Autenticación deshabilitada - obtener todos los eventos
        const { searchParams } = new URL(req.url);
        const type = searchParams.get('type') as EventType | null;
        const projectId = searchParams.get('projectId');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        let events;

        if (type) {
            events = await EventService.getByType(type);
        } else if (projectId) {
            events = await EventService.getByProject(projectId);
        } else if (startDate && endDate) {
            events = await EventService.getCalendar(new Date(startDate), new Date(endDate));
        } else {
            events = await EventService.getAll();
        }

        return NextResponse.json(events);
    } catch (error: unknown) {
        console.error('[API EVENTS] Error:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        // Autenticación deshabilitada - usar un usuario por defecto
        const body = await req.json();
        const data = createEventSchema.parse(body);

        // Obtener el primer usuario de la base de datos como owner por defecto
        const { prisma } = await import('@/lib/prisma');
        const defaultUser = await prisma.user.findFirst();
        
        if (!defaultUser) {
            return NextResponse.json({ error: 'No users found in database' }, { status: 500 });
        }

        const event = await EventService.create(
            {
                ...data,
                type: data.type as EventType,
                projectId: data.projectId && data.projectId !== '' ? data.projectId : undefined,
            },
            defaultUser.id,
            defaultUser.role
        );

        await AuditService.log(
            defaultUser.id,
            AuditAction.CREATE,
            'EVENT',
            event.id,
            { title: event.title, type: event.type }
        );

        return NextResponse.json(event);
    } catch (error: unknown) {
        console.error('[API EVENTS POST] Error:', error);
        const message = error instanceof Error ? error.message : 'Failed to create event';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
