import { prisma } from '@/lib/prisma';
import { verifyPassword, signAccessToken, signRefreshToken, verifyRefreshToken } from '@/lib/auth';

export const AuthService = {
    async login(email: string, password: string) {
        try {
            const user = await prisma.user.findUnique({ where: { email } });
            if (!user) {
                throw new Error('Credenciales inválidas');
            }

            const isValid = await verifyPassword(password, user.passwordHash);
            if (!isValid) {
                throw new Error('Credenciales inválidas');
            }

            const accessToken = await signAccessToken({
                userId: user.id,
                role: user.role,
                email: user.email,
            });

            const refreshToken = await signRefreshToken({ userId: user.id });

            return { user, accessToken, refreshToken };
        } catch (error: unknown) {
            // Si es un error de Prisma (base de datos), lanzar un error más descriptivo
            if (error instanceof Error && (error.message.includes('Prisma') || error.message.includes('database'))) {
                throw new Error('Error de conexión a la base de datos');
            }
            throw error;
        }
    },

    async refresh(token: string) {
        const payload = await verifyRefreshToken(token);
        if (!payload?.userId) throw new Error('Invalid refresh token');

        const user = await prisma.user.findUnique({ where: { id: payload.userId as string } });
        if (!user) throw new Error('User NOT found');

        const accessToken = await signAccessToken({
            userId: user.id,
            role: user.role,
            email: user.email,
        });

        return { accessToken };
    },
};
