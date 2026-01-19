import { NextResponse } from 'next/server';
import { ProjectService } from '@/lib/services/project.service';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const updateOrderSchema = z.object({
    projectIds: z.array(z.string().uuid()),
});

async function getAuth() {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) return null;
    return {
        userId: data.user.id,
        role: data.user.user_metadata?.role || 'DEVELOPER',
    };
}

export async function POST(req: Request) {
    try {
        const user = await getAuth();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { projectIds } = updateOrderSchema.parse(body);

        const projects = await ProjectService.updateOrder(projectIds, user.role as string);

        return NextResponse.json(projects);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to update order';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
