import { prisma } from '@/lib/prisma';
import { EventType, Role } from '@prisma/client';

export const EventService = {
    async create(
        data: {
            title: string;
            description?: string;
            type: EventType;
            startDate: string | Date;
            endDate: string | Date;
            progress?: number;
            projectId?: string;
        },
        actorId: string,
        actorRole: string
    ) {
        if (actorRole !== Role.ADMIN) {
            throw new Error('Only admins can create events');
        }

        return await prisma.event.create({
            data: {
                title: data.title,
                description: data.description,
                type: data.type,
                startDate: new Date(data.startDate),
                endDate: new Date(data.endDate),
                progress: data.progress || 0,
                projectId: data.projectId,
            },
            include: {
                project: {
                    select: {
                        id: true,
                        name: true,
                        priority: true,
                    },
                },
            },
        });
    },

    async getAll() {
        try {
            return await prisma.event.findMany({
                include: {
                    project: {
                        select: {
                            id: true,
                            name: true,
                            priority: true,
                        },
                    },
                },
                orderBy: [{ startDate: 'asc' }],
            });
        } catch (error: unknown) {
            // Si la tabla Event no existe o falta el campo progress, retornar array vacío
            console.warn('Event table or fields may not exist yet:', error);
            return [];
        }
    },

    async getByType(type: EventType) {
        try {
            return await prisma.event.findMany({
                where: { type },
                include: {
                    project: {
                        select: {
                            id: true,
                            name: true,
                            priority: true,
                        },
                    },
                },
                orderBy: [{ startDate: 'asc' }],
            });
        } catch (error: unknown) {
            console.warn('Event table or fields may not exist yet:', error);
            return [];
        }
    },

    async getByProject(projectId: string) {
        return await prisma.event.findMany({
            where: { projectId },
            orderBy: [{ startDate: 'asc' }],
        });
    },

    async getCalendar(startDate: Date, endDate: Date) {
        try {
            return await prisma.event.findMany({
                where: {
                    OR: [
                        {
                            startDate: { gte: startDate, lte: endDate },
                        },
                        {
                            endDate: { gte: startDate, lte: endDate },
                        },
                        {
                            AND: [
                                { startDate: { lte: startDate } },
                                { endDate: { gte: endDate } },
                            ],
                        },
                    ],
                },
                include: {
                    project: {
                        select: {
                            id: true,
                            name: true,
                            priority: true,
                        },
                    },
                },
                orderBy: [{ startDate: 'asc' }],
            });
        } catch (error: unknown) {
            console.warn('Event table or fields may not exist yet:', error);
            return [];
        }
    },

    async update(
        id: string,
        data: Partial<{
            title: string;
            description: string;
            type: EventType;
            startDate: string | Date;
            endDate: string | Date;
            progress: number;
            projectId: string;
        }>,
        actorId: string,
        actorRole: string
    ) {
        if (actorRole !== Role.ADMIN) {
            throw new Error('Only admins can update events');
        }

        return await prisma.event.update({
            where: { id },
            data: {
                ...data,
                startDate: data.startDate ? new Date(data.startDate) : undefined,
                endDate: data.endDate ? new Date(data.endDate) : undefined,
                progress: data.progress !== undefined ? Math.max(0, Math.min(100, data.progress)) : undefined,
            },
            include: {
                project: {
                    select: {
                        id: true,
                        name: true,
                        priority: true,
                    },
                },
            },
        });
    },

    async delete(id: string, actorId: string, actorRole: string) {
        if (actorRole !== Role.ADMIN) {
            throw new Error('Only admins can delete events');
        }
        return await prisma.event.delete({ where: { id } });
    },
};
