import prisma from '../lib/prisma.js';
import { type JwtPayload } from '../types/index.js';

export class LogsService {
  static async getAll(user: JwtPayload, taskId?: string) {
    const tasks = await prisma.task.findMany({
      where: {
        userId: user.userId,
      },
      orderBy: { createdAt: 'desc' },
    });
    const taskIds = tasks.map((task) => task.id);
    const logs = await prisma.log.findMany({
      where: {
        taskId: taskId ? taskId : { in: taskIds },
      },
      orderBy: { startedAt: 'desc' },
    });
    return logs;
  }
}
