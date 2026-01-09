import { prisma } from '@/lib/prisma';
import { Priority, Status, Role } from '@prisma/client';

// RecurrenceType puede no existir si el cliente no se ha generado
type RecurrenceType = 'NONE' | 'DAILY' | 'WEEKLY';

export const TaskService = {
    async create(
        data: {
            title: string;
            description?: string;
            priority: Priority;
            status?: Status;
            deadline?: string | Date;
            assigneeId?: string;
            projectId?: string;
            recurrenceType?: RecurrenceType | string;
            orderIndex?: number;
        },
        actorId: string,
        actorRole: string
    ) {
        if (actorRole !== Role.ADMIN) {
            throw new Error('Only admins can create tasks');
        }

        try {
            const taskData: any = {
                title: data.title,
                description: data.description,
                priority: data.priority,
                status: data.status || 'NOT_STARTED',
                deadline: data.deadline ? new Date(data.deadline) : undefined,
                assigneeId: data.assigneeId,
            };

            // Solo agregar campos nuevos si existen
            if (data.projectId !== undefined) {
                taskData.projectId = data.projectId;
            }
            if (data.recurrenceType !== undefined) {
                taskData.recurrenceType = data.recurrenceType || 'NONE';
            }
            if (data.orderIndex !== undefined) {
                taskData.orderIndex = data.orderIndex || 0;
            }

            return await prisma.task.create({
                data: taskData,
                include: {
                    assignee: { select: { id: true, name: true, email: true } },
                    project: { select: { id: true, name: true, priority: true } },
                },
            });
        } catch (error: unknown) {
            // Si falla por campos que no existen, crear sin ellos
            return await prisma.task.create({
                data: {
                    title: data.title,
                    description: data.description,
                    priority: data.priority,
                    deadline: data.deadline ? new Date(data.deadline) : undefined,
                    assigneeId: data.assigneeId,
                },
                include: {
                    assignee: { select: { id: true, name: true, email: true } },
                },
            });
        }
    },

    async getAll() {
        try {
            return await prisma.task.findMany({
                include: {
                    assignee: { select: { id: true, name: true, email: true } },
                    project: { select: { id: true, name: true, priority: true } },
                },
                orderBy: [
                    { orderIndex: 'asc' },
                    { priority: 'asc' },
                    { deadline: 'asc' },
                ],
            });
        } catch (error: unknown) {
            // Si orderIndex no existe, usar orden básico
            return await prisma.task.findMany({
                include: {
                    assignee: { select: { id: true, name: true, email: true } },
                },
                orderBy: [{ priority: 'asc' }, { deadline: 'asc' }],
            });
        }
    },

    async getMyTasks(userId: string) {
        try {
            return await prisma.task.findMany({
                where: { assigneeId: userId },
                include: {
                    assignee: { select: { id: true, name: true, email: true } },
                    project: { select: { id: true, name: true, priority: true } },
                },
                orderBy: [
                    { orderIndex: 'asc' },
                    { priority: 'asc' },
                    { deadline: 'asc' },
                ],
            });
        } catch (error: unknown) {
            // Si orderIndex no existe, usar orden básico
            return await prisma.task.findMany({
                where: { assigneeId: userId },
                include: {
                    assignee: { select: { id: true, name: true, email: true } },
                },
                orderBy: [{ priority: 'asc' }, { deadline: 'asc' }],
            });
        }
    },

    async getDailyTasks(date?: Date) {
        const targetDate = date ? new Date(date) : new Date();
        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);

        try {
            return await prisma.task.findMany({
                where: {
                OR: [
                    { recurrenceType: 'DAILY' },
                    {
                        AND: [
                            { recurrenceType: 'WEEKLY' },
                            { deadline: { gte: startOfDay, lte: endOfDay } },
                        ],
                    },
                    {
                        AND: [
                            { recurrenceType: 'NONE' },
                            { deadline: { gte: startOfDay, lte: endOfDay } },
                        ],
                    },
                    // Fallback: si recurrenceType no existe, buscar por deadline
                    { deadline: { gte: startOfDay, lte: endOfDay } },
                ],
                },
                include: {
                    assignee: { select: { id: true, name: true, email: true } },
                    project: { select: { id: true, name: true, priority: true } },
                },
                orderBy: [
                    { orderIndex: 'asc' },
                    { priority: 'asc' },
                ],
            });
        } catch (error: unknown) {
            // Si falla por campos que no existen, usar consulta básica
            return await prisma.task.findMany({
                where: {
                    deadline: { gte: startOfDay, lte: endOfDay },
                },
                include: {
                    assignee: { select: { id: true, name: true, email: true } },
                },
            orderBy: [{ priority: 'asc' }, { deadline: 'asc' }],
            });
        }
    },

    async getWeeklyTasks(startDate?: Date) {
        const start = startDate ? new Date(startDate) : new Date();
        const weekStart = new Date(start);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        weekStart.setHours(0, 0, 0, 0);

        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);
        weekEnd.setHours(23, 59, 59, 999);

        try {
            return await prisma.task.findMany({
                where: {
                OR: [
                    { recurrenceType: 'WEEKLY' },
                    {
                        AND: [
                            { recurrenceType: 'NONE' },
                            { deadline: { gte: weekStart, lte: weekEnd } },
                        ],
                    },
                    // Fallback: si recurrenceType no existe, buscar por deadline
                    { deadline: { gte: weekStart, lte: weekEnd } },
                ],
                },
                include: {
                    assignee: { select: { id: true, name: true, email: true } },
                    project: { select: { id: true, name: true, priority: true } },
                },
                orderBy: [
                    { orderIndex: 'asc' },
                    { priority: 'asc' },
                    { deadline: 'asc' },
                ],
            });
        } catch (error: unknown) {
            // Si falla por campos que no existen, usar consulta básica
            return await prisma.task.findMany({
                where: {
                    deadline: { gte: weekStart, lte: weekEnd },
                },
                include: {
                    assignee: { select: { id: true, name: true, email: true } },
                },
                orderBy: [{ priority: 'asc' }, { deadline: 'asc' }],
            });
        }
    },

    async update(
        id: string,
        data: Partial<{
            title: string;
            description: string;
            priority: Priority;
            status: Status;
            deadline: string | Date;
            assigneeId: string;
            projectId: string;
            recurrenceType: RecurrenceType | string;
            orderIndex: number;
        }>,
        actorId: string,
        actorRole: string
    ) {
        const task = await prisma.task.findUnique({ where: { id } });
        if (!task) throw new Error('Task not found');

        // Developer restrictions
        if (actorRole === Role.DEVELOPER) {
            // Devs can only change status
            if (data.priority || data.title || data.description || data.deadline || data.assigneeId || data.projectId || data.recurrenceType || data.orderIndex !== undefined) {
                throw new Error('Developers can only update task status');
            }
            // Devs can only update their own tasks
            if (task.assigneeId !== actorId) {
                throw new Error('You can only update your assigned tasks');
            }
        }

        // Construir el objeto data de forma segura para Prisma
        const updateData: any = {};
        
        if (data.title !== undefined) updateData.title = data.title;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.priority !== undefined) updateData.priority = data.priority;
        if (data.status !== undefined) updateData.status = data.status;
        if (data.deadline !== undefined) {
            updateData.deadline = data.deadline ? new Date(data.deadline) : null;
        }
        if (data.assigneeId !== undefined) updateData.assigneeId = data.assigneeId;
        if (data.projectId !== undefined) {
            updateData.projectId = data.projectId || null;
        }
        if (data.recurrenceType !== undefined) updateData.recurrenceType = data.recurrenceType;
        if (data.orderIndex !== undefined) updateData.orderIndex = data.orderIndex;

        return await prisma.task.update({
            where: { id },
            data: updateData,
            include: {
                assignee: { select: { id: true, name: true, email: true } },
                project: { select: { id: true, name: true, priority: true } },
            },
        });
    },

    async updateOrder(taskIds: string[], actorRole: string) {
        if (actorRole !== Role.ADMIN) {
            throw new Error('Only admins can update task order');
        }

        await Promise.all(
            taskIds.map((id, index) =>
                prisma.task.update({
                    where: { id },
                    data: { orderIndex: index },
                })
            )
        );

        return await this.getAll();
    },

    async delete(id: string, actorId: string, actorRole: string) {
        if (actorRole !== Role.ADMIN) {
            throw new Error('Only admins can delete tasks');
        }
        return await prisma.task.delete({ where: { id } });
    }
};
