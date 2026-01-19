import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const awardSchema = z.object({
  email: z.string().email(),
  stars: z.number().min(1).max(3),
  reason: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    const role = data.user?.user_metadata?.role;
    const status = data.user?.user_metadata?.status;

    if (!data.user || role !== 'ADMIN' || status !== 'ACTIVE') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const payload = awardSchema.parse(await req.json());
    const user = await prisma.user.findUnique({ where: { email: payload.email } });
    if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

    const previousStars = user.starsBalance ?? 0;
    const newStars = previousStars + payload.stars;
    const previousBonuses = Math.floor(previousStars / 3);
    const newBonuses = Math.floor(newStars / 3);
    const bonusesToAdd = Math.max(0, newBonuses - previousBonuses);

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: {
          starsBalance: newStars,
          bonusesBalance: (user.bonusesBalance ?? 0) + bonusesToAdd,
        },
      });

      await tx.starTransaction.create({
        data: {
          userId: user.id,
          stars: payload.stars,
          reason: payload.reason || 'Admin award',
        },
      });

      if (bonusesToAdd > 0) {
        await tx.bonus.createMany({
          data: Array.from({ length: bonusesToAdd }).map(() => ({
            userId: user.id,
            type: 'AUTO',
            status: 'ACTIVE',
          })),
        });
      }
    });

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to award stars';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
