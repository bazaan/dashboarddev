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

  const list = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
  const existing = list.data.users.find((user) => user.email === adminEmail);

  let userId = existing?.id;
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

  await prisma.user.upsert({
    where: { email: adminEmail },
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
      id: userId,
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
    console.error('Error configurando ADMIN:', err);
    await prisma.$disconnect();
    process.exit(1);
  });
