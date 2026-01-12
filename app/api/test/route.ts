import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const checks = {
            databaseUrl: !!process.env.DATABASE_URL,
            directUrl: !!process.env.DIRECT_URL,
            jwtSecret: !!process.env.JWT_SECRET,
            jwtRefreshSecret: !!process.env.JWT_REFRESH_SECRET,
            nodeEnv: process.env.NODE_ENV || 'not set',
            netlify: process.env.NETLIFY === 'true',
            timestamp: new Date().toISOString(),
        };

        // Intentar conectar a la base de datos
        let dbConnection = false;
        let dbError = null;
        try {
            const { prisma } = await import('@/lib/prisma');
            await prisma.$connect();
            dbConnection = true;
            await prisma.$disconnect();
        } catch (error) {
            dbError = error instanceof Error ? error.message : 'Unknown error';
        }

        return NextResponse.json({
            status: 'ok',
            checks: {
                ...checks,
                dbConnection,
                dbError: dbError || null,
            },
            allConfigured: checks.databaseUrl && checks.jwtSecret && checks.jwtRefreshSecret && dbConnection,
        });
    } catch (error) {
        return NextResponse.json(
            {
                status: 'error',
                error: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
