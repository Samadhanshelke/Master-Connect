import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNotificationDto } from './dto';
import { RequestUser } from '../common/decorators/current-user.decorator';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async list(userId: string) {
    const items = await this.prisma.notification.findMany({
      where: { recipientId: userId },
      orderBy: { createdAt: 'desc' },
    });
    return items.map((item) => ({
      id: item.clientKey || item.id,
      type: item.type,
      recipientId: item.recipientId,
      actorId: item.actorId,
      actorName: item.actorName,
      message: item.message,
      postId: item.postId,
      isRead: item.isRead,
      createdAt: item.createdAt.toISOString(),
    }));
  }

  async markRead(userId: string, id: string) {
    await this.prisma.notification.updateMany({
      where: { recipientId: userId, OR: [{ id }, { clientKey: id }] },
      data: { isRead: true },
    });
    return { ok: true };
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { recipientId: userId, isRead: false },
      data: { isRead: true },
    });
    return { ok: true };
  }

  async create(user: RequestUser, dto: CreateNotificationDto) {
    if (dto.recipientId === user.id) return { ok: true };
    await this.prisma.notification.upsert({
      where: { clientKey: dto.clientKey },
      update: { message: dto.message, isRead: false },
      create: {
        clientKey: dto.clientKey,
        type: dto.type,
        recipientId: dto.recipientId,
        actorId: user.id,
        actorName: user.name,
        message: dto.message,
        postId: dto.postId || null,
      },
    });
    return { ok: true };
  }

  async remove(userId: string, id: string) {
    await this.prisma.notification.deleteMany({
      where: {
        OR: [
          { id, recipientId: userId },
          { clientKey: id, recipientId: userId },
          { clientKey: id, actorId: userId },
        ],
      },
    });
    return { ok: true };
  }

  async welcome(user: RequestUser) {
    const clientKey = `welcome_${user.id}`;
    await this.prisma.notification.upsert({
      where: { clientKey },
      update: {},
      create: {
        clientKey,
        type: 'system',
        recipientId: user.id,
        actorId: user.id,
        actorName: 'Master Connect',
        message: 'Welcome to the community',
      },
    });
    return { ok: true };
  }
}
