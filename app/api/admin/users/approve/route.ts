import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const approveSchema = z.object({
  userId: z.string().uuid(),
});

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: authData } = await supabase.auth.getUser();
    const adminRole = authData.user?.user_metadata?.role;
    const adminStatus = authData.user?.user_metadata?.status;

    if (!authData.user || adminRole !== 'ADMIN' || adminStatus !== 'ACTIVE') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await req.json();
    const { userId } = approveSchema.parse(body);

    const supabaseAdmin = createSupabaseAdminClient();
    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: {
        status: 'ACTIVE',
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        status: 'ACTIVE',
        approvedAt: new Date(),
        approvedById: authData.user.id,
      },
    });

    return NextResponse.json({ message: 'Usuario aprobado' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al aprobar usuario';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
