import 'dotenv/config';
import { PrismaClient, Role } from '@prisma/client';
import { hashPassword } from '../lib/auth';

const prisma = new PrismaClient();

async function main() {
    const email = 'admin@alef.com';
    console.log(`Checking for user: ${email}`);
    const existingUser = await prisma.user.findUnique({
        where: { email },
    });

    if (!existingUser) {
        console.log('Creating admin user...');
        const passwordHash = await hashPassword('admin123');
        await prisma.user.create({
            data: {
                email,
                passwordHash,
                role: Role.ADMIN,
                name: 'Super Admin',
            },
        });
        console.log('✅ Admin user created: admin@alef.com / admin123');
    } else {
        console.log('ℹ️ Admin user already exists');
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
