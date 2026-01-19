import { createClient } from '@supabase/supabase-js';
import { prisma } from '@/lib/prisma';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
}

const adminEmail = process.env.ADMIN_EMAIL || 'jbazan@alef.company';
const adminPassword = process.env.ADMIN_PASSWORD || '12345jp123';
const adminName = process.env.ADMIN_NAME || 'JBazan';

async function main() {
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  // 1) Eliminar datos dependientes en la DB de la app
  await prisma.reportComment.deleteMany();
  await prisma.report.deleteMany();
  await prisma.note.deleteMany();
  await prisma.taskComment.deleteMany();
  await prisma.taskHistory.deleteMany();
  await prisma.eventParticipant.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.event.deleteMany();
  await prisma.starTransaction.deleteMany();
  await prisma.bonus.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.user.deleteMany();

  // 2) Eliminar todos los usuarios de Supabase Auth
  const users = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
  for (const user of users.data.users) {
    await supabaseAdmin.auth.admin.deleteUser(user.id);
  }

  // 3) Crear ADMIN principal
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

  await prisma.user.create({
    data: {
      id: created.data.user.id,
      email: adminEmail,
      passwordHash: 'SUPABASE_AUTH',
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
    console.error('Error reseteando usuarios:', err);
    await prisma.$disconnect();
    process.exit(1);
  });
