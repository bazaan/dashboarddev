import { prisma } from '@/lib/prisma';
import { AuditAction } from '@prisma/client';

export const AuditService = {
    async log(userId: string, action: AuditAction, resourceType: string, resourceId?: string | null, details?: object) {
        try {
            await prisma.auditLog.create({
                data: {
                    userId,
                    action,
                    resourceType,
                    resourceId,
                    details: details ? JSON.stringify(details) : undefined,
                },
            });
        } catch (error) {
            console.error('Failed to create audit log:', error);
            // Audit failure should not block main flow, but should be noted.
        }
    },
};
