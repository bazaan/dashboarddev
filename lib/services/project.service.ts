import { prisma } from '@/lib/prisma';
import { Priority, Role } from '@prisma/client';

// ProjectStatus puede no existir si el cliente no se ha generado
type ProjectStatus = 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'ARCHIVED';

export const ProjectService = {
    async create(
        data: {
            name: string;
            description?: string;
            brief?: string;
            detailedBrief?: string;
            drivePromptsUrl?: string;
            driveN8nFlowUrl?: string;
            driveDashboardUrl?: string;
            priority: Priority;
            orderIndex?: number;
        },
        ownerId: string,
        actorRole: string
    ) {
        if (actorRole !== Role.ADMIN) {
            throw new Error('Only admins can create projects');
        }

        try {
            return await prisma.project.create({
                data: {
                    name: data.name,
                    description: data.description,
                    brief: data.brief,
                    detailedBrief: data.detailedBrief,
                    drivePromptsUrl: data.drivePromptsUrl,
                    driveN8nFlowUrl: data.driveN8nFlowUrl,
                    driveDashboardUrl: data.driveDashboardUrl,
                    priority: data.priority,
                    orderIndex: data.orderIndex || 0,
                    ownerId,
                },
                include: {
                    owner: { select: { id: true, name: true, email: true } },
                    tasks: { include: { assignee: { select: { id: true, name: true } } } },
                    events: true,
                },
            });
        } catch (error: unknown) {
            console.error('Error creating project - table may not exist yet:', error);
            throw error;
        }
    },

    async getAll() {
        try {
            return await prisma.project.findMany({
                include: {
                    owner: { select: { id: true, name: true, email: true } },
                    tasks: { include: { assignee: { select: { id: true, name: true } } } },
                    events: true,
                },
                orderBy: [{ orderIndex: 'asc' }, { priority: 'asc' }, { createdAt: 'desc' }],
            });
        } catch (error: unknown) {
            // Si la tabla Project no existe, retornar array vacío
            console.warn('Project table does not exist yet:', error);
            return [];
        }
    },

    async getById(id: string) {
        try {
            return await prisma.project.findUnique({
                where: { id },
                include: {
                    owner: { select: { id: true, name: true, email: true } },
                    tasks: {
                        include: { assignee: { select: { id: true, name: true } } },
                        orderBy: [{ orderIndex: 'asc' }, { priority: 'asc' }],
                    },
                    events: {
                        orderBy: [{ startDate: 'asc' }],
                    },
                },
            });
        } catch (error: unknown) {
            console.warn('Project table does not exist yet:', error);
            return null;
        }
    },

    async update(
        id: string,
        data: Partial<{
            name: string;
            description: string;
            brief: string;
            detailedBrief: string;
            drivePromptsUrl: string;
            driveN8nFlowUrl: string;
            driveDashboardUrl: string;
            priority: Priority;
            orderIndex: number;
            status: ProjectStatus;
        }>,
        actorId: string,
        actorRole: string
    ) {
        if (actorRole !== Role.ADMIN) {
            throw new Error('Only admins can update projects');
        }

        const project = await prisma.project.findUnique({ where: { id } });
        if (!project) throw new Error('Project not found');

        return await prisma.project.update({
            where: { id },
            data,
            include: {
                owner: { select: { id: true, name: true, email: true } },
                tasks: { include: { assignee: { select: { id: true, name: true } } } },
                events: true,
            },
        });
    },

    async delete(id: string, actorId: string, actorRole: string) {
        if (actorRole !== Role.ADMIN) {
            throw new Error('Only admins can delete projects');
        }
        return await prisma.project.delete({ where: { id } });
    },

    async updateOrder(projectIds: string[], actorRole: string) {
        if (actorRole !== Role.ADMIN) {
            throw new Error('Only admins can update project order');
        }

        await Promise.all(
            projectIds.map((id, index) =>
                prisma.project.update({
                    where: { id },
                    data: { orderIndex: index },
                })
            )
        );

        return await this.getAll();
    },
};
