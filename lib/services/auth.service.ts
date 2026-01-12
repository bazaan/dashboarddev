import { prisma } from '@/lib/prisma';
import { verifyPassword, signAccessToken, signRefreshToken, verifyRefreshToken } from '@/lib/auth';

export const AuthService = {
    async login(email: string, password: string) {
        try {
            console.log('[AuthService] Intentando login para:', email);
            
            // Verificar que Prisma pueda conectarse
            try {
                await prisma.$connect();
                console.log('[AuthService] Conexión a BD exitosa');
            } catch (connectError) {
                console.error('[AuthService] Error conectando a BD:', connectError);
                throw new Error('No se puede conectar a la base de datos. Verifica DATABASE_URL.');
            }

            const user = await prisma.user.findUnique({ where: { email } });
            if (!user) {
                console.log('[AuthService] Usuario no encontrado:', email);
                throw new Error('Credenciales inválidas');
            }

            console.log('[AuthService] Usuario encontrado, verificando contraseña');
            const isValid = await verifyPassword(password, user.passwordHash);
            if (!isValid) {
                console.log('[AuthService] Contraseña inválida para:', email);
                throw new Error('Credenciales inválidas');
            }

            console.log('[AuthService] Contraseña válida, generando tokens');
            const accessToken = await signAccessToken({
                userId: user.id,
                role: user.role,
                email: user.email,
            });

            const refreshToken = await signRefreshToken({ userId: user.id });

            console.log('[AuthService] Tokens generados exitosamente');
            return { user, accessToken, refreshToken };
        } catch (error: unknown) {
            console.error('[AuthService] Error en login:', error);
            
            // Si es un error de Prisma (base de datos), lanzar un error más descriptivo
            if (error instanceof Error) {
                if (error.message.includes('Prisma') || 
                    error.message.includes('database') || 
                    error.message.includes('DATABASE_URL') ||
                    error.message.includes('Can\'t reach database server') ||
                    error.message.includes('P1001') ||
                    error.message.includes('P1000') ||
                    error.message.includes('P1017')) {
                    throw new Error('Error de conexión a la base de datos. Verifica DATABASE_URL en las variables de entorno.');
                }
                // Re-lanzar errores conocidos (como credenciales inválidas)
                throw error;
            }
            throw new Error('Error desconocido al autenticar');
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
