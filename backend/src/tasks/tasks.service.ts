import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  // Open tasks visible to all workers
  findOpen() {
    return this.prisma.task.findMany({
      where: { status: 'OPEN' },
      include: { createdBy: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Tasks claimed by the current worker
  findMine(userId: number) {
    return this.prisma.task.findMany({
      where: { claimedById: userId },
      include: { createdBy: { select: { name: true } } },
      orderBy: { updatedAt: 'desc' },
    });
  }

  // Tasks posted by the current employee
  findPosted(userId: number) {
    return this.prisma.task.findMany({
      where: { createdById: userId },
      include: { claimedBy: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Create a new task
  create(userId: number, dto: CreateTaskDto) {
    return this.prisma.task.create({
      data: {
        title: dto.title.trim(),
        description: dto.description.trim(),
        priority: dto.priority,
        category: dto.category,
        dueDate: new Date(dto.dueDate),
        estimatedHours: Number(dto.estimatedHours),
        createdById: userId,
      },
    });
  }

  // Delete an OPEN task (only the creator can delete)
  async delete(taskId: number, userId: number) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new NotFoundException('Task not found.');
    if (task.createdById !== userId) throw new ForbiddenException('You can only delete your own tasks.');
    if (task.status !== 'OPEN') throw new BadRequestException('Only open tasks can be deleted.');
    return this.prisma.task.delete({ where: { id: taskId } });
  }

  // Claim an open task
  async claim(taskId: number, userId: number) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new NotFoundException('Task not found.');
    if (task.status !== 'OPEN') throw new BadRequestException('Task is no longer available.');
    return this.prisma.task.update({
      where: { id: taskId },
      data: { status: 'CLAIMED', claimedById: userId },
    });
  }

  // Mark a claimed task as completed
  async complete(taskId: number, userId: number) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new NotFoundException('Task not found.');
    if (task.claimedById !== userId) throw new ForbiddenException('You can only complete your own tasks.');
    if (task.status !== 'CLAIMED') throw new BadRequestException('Task is not in progress.');
    return this.prisma.task.update({
      where: { id: taskId },
      data: { status: 'COMPLETED' },
    });
  }
}
