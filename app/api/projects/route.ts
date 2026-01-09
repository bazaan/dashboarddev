import { NextResponse } from 'next/server';
import { ProjectService } from '@/lib/services/project.service';
import { verifyAccessToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { AuditService } from '@/lib/services/audit.service';
import { AuditAction } from '@prisma/client';
import { z } from 'zod';

const createProjectSchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    brief: z.string().optional(),
    detailedBrief: z.string().optional(),
    drivePromptsUrl: z.string().url().optional().or(z.literal('')),
    driveN8nFlowUrl: z.string().url().optional().or(z.literal('')),
    driveDashboardUrl: z.string().url().optional().or(z.literal('')),
    priority: z.enum(['HIGH', 'MEDIUM', 'LOW']),
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

        const projects = await ProjectService.getAll();
        return NextResponse.json(projects);
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
        const data = createProjectSchema.parse(body);

        const project = await ProjectService.create(
            {
                ...data,
                drivePromptsUrl: data.drivePromptsUrl || undefined,
                driveN8nFlowUrl: data.driveN8nFlowUrl || undefined,
                driveDashboardUrl: data.driveDashboardUrl || undefined,
            },
            user.userId as string,
            user.role as string
        );

        await AuditService.log(
            user.userId as string,
            AuditAction.CREATE,
            'PROJECT',
            project.id,
            { name: project.name }
        );

        return NextResponse.json(project);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to create project';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
