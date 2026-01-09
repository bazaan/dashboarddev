import { prisma } from '@/lib/prisma';
import { verifyPassword, signAccessToken, signRefreshToken, verifyRefreshToken } from '@/lib/auth';

export const AuthService = {
    async login(email: string, password: string) {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            throw new Error('Invalid credentials');
        }

        const isValid = await verifyPassword(password, user.passwordHash);
        if (!isValid) {
            throw new Error('Invalid credentials');
        }

        const accessToken = await signAccessToken({
            userId: user.id,
            role: user.role,
            email: user.email,
        });

        const refreshToken = await signRefreshToken({ userId: user.id });

        return { user, accessToken, refreshToken };
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
