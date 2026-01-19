import { createClient } from '@supabase/supabase-js';
import { prisma } from '@/lib/prisma';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
}

const adminEmail = process.env.ADMIN_EMAIL || 'admin@alef.com';
const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
const adminName = process.env.ADMIN_NAME || 'Super Admin';

async function main() {
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const existing = await supabaseAdmin.auth.admin.listUsers({ perPage: 200 });
  const existingUser = existing.data.users.find((user) => user.email === adminEmail);
  let userId = existingUser?.id;

  if (!userId) {
    const created = await supabaseAdmin.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        role: 'ADMIN',
        status: 'ACTIVE',
        name: adminName,
      },
    });

    if (created.error || !created.data.user) {
      throw new Error(created.error?.message || 'No se pudo crear el ADMIN');
    }

    userId = created.data.user.id;
  } else {
    const updated = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: adminPassword,
      user_metadata: {
        role: 'ADMIN',
        status: 'ACTIVE',
        name: adminName,
      },
    });
    if (updated.error) {
      throw new Error(updated.error.message || 'No se pudo actualizar el ADMIN');
    }
  }

  const existingAppUser = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (existingAppUser && existingAppUser.id !== userId) {
    const oldId = existingAppUser.id;
    const newId = userId;
    const tempEmail = `legacy-${oldId}@alef.local`;

    await prisma.user.update({
      where: { id: oldId },
      data: { email: tempEmail },
    });

    await prisma.user.create({
      data: {
        id: newId,
        email: adminEmail,
        passwordHash: 'SUPABASE_AUTH',
        name: adminName,
        role: 'ADMIN',
        status: 'ACTIVE',
        approvedAt: new Date(),
      },
    });

    await prisma.$transaction([
      prisma.$executeRaw`UPDATE "Task" SET "assigneeId"=${newId} WHERE "assigneeId"=${oldId}`,
      prisma.$executeRaw`UPDATE "Task" SET "approvedById"=${newId} WHERE "approvedById"=${oldId}`,
      prisma.$executeRaw`UPDATE "Project" SET "ownerId"=${newId} WHERE "ownerId"=${oldId}`,
      prisma.$executeRaw`UPDATE "ProjectMember" SET "userId"=${newId} WHERE "userId"=${oldId}`,
      prisma.$executeRaw`UPDATE "EventParticipant" SET "userId"=${newId} WHERE "userId"=${oldId}`,
      prisma.$executeRaw`UPDATE "TaskComment" SET "authorId"=${newId} WHERE "authorId"=${oldId}`,
      prisma.$executeRaw`UPDATE "TaskHistory" SET "actorId"=${newId} WHERE "actorId"=${oldId}`,
      prisma.$executeRaw`UPDATE "Note" SET "authorId"=${newId} WHERE "authorId"=${oldId}`,
      prisma.$executeRaw`UPDATE "Report" SET "authorId"=${newId} WHERE "authorId"=${oldId}`,
      prisma.$executeRaw`UPDATE "Report" SET "resolverId"=${newId} WHERE "resolverId"=${oldId}`,
      prisma.$executeRaw`UPDATE "ReportComment" SET "authorId"=${newId} WHERE "authorId"=${oldId}`,
      prisma.$executeRaw`UPDATE "Notification" SET "userId"=${newId} WHERE "userId"=${oldId}`,
      prisma.$executeRaw`UPDATE "StarTransaction" SET "userId"=${newId} WHERE "userId"=${oldId}`,
      prisma.$executeRaw`UPDATE "Bonus" SET "userId"=${newId} WHERE "userId"=${oldId}`,
      prisma.$executeRaw`UPDATE "AuditLog" SET "userId"=${newId} WHERE "userId"=${oldId}`,
      prisma.$executeRaw`UPDATE "User" SET "approvedById"=${newId} WHERE "approvedById"=${oldId}`,
    ]);

    await prisma.user.delete({ where: { id: oldId } });
  }

  await prisma.user.upsert({
    where: { id: userId },
    create: {
      id: userId,
      email: adminEmail,
      passwordHash: 'SUPABASE_AUTH',
      name: adminName,
      role: 'ADMIN',
      status: 'ACTIVE',
      approvedAt: new Date(),
    },
    update: {
      email: adminEmail,
      name: adminName,
      role: 'ADMIN',
      status: 'ACTIVE',
      approvedAt: new Date(),
    },
  });

  console.log(`ADMIN listo: ${adminEmail}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error('Error creando ADMIN:', err);
    await prisma.$disconnect();
    process.exit(1);
  });
