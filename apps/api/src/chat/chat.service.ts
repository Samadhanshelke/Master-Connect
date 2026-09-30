import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SendMessageDto } from './dto';
import { RequestUser } from '../common/decorators/current-user.decorator';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async rooms() {
    const rooms = await this.prisma.room.findMany({
      include: { _count: { select: { members: true } } },
      orderBy: { name: 'asc' },
    });
    return rooms.map((room) => ({
      id: room.id,
      name: room.name,
      city: room.city,
      type: room.type,
      memberCount: room._count.members,
    }));
  }

  async myRooms(userId: string) {
    const memberships = await this.prisma.roomMember.findMany({
      where: { userId },
      include: { room: { include: { _count: { select: { members: true } } } } },
    });
    return memberships.map((membership) => ({
      id: membership.room.id,
      name: membership.room.name,
      city: membership.room.city,
      type: membership.room.type,
      memberCount: membership.room._count.members,
    }));
  }

  async messages(roomId: string) {
    const room = await this.prisma.room.findUnique({ where: { id: roomId } });
    if (!room) throw new NotFoundException({ error: 'Room not found' });
    const messages = await this.prisma.message.findMany({
      where: { roomId },
      orderBy: { createdAt: 'asc' },
    });
    return messages.map((message) => ({
      id: message.id,
      authorId: message.authorId,
      authorName: message.authorName,
      text: message.text,
      createdAt: message.createdAt.toISOString(),
      attachment: message.attachment ? JSON.parse(message.attachment) : undefined,
    }));
  }

  async members(roomId: string) {
    const members = await this.prisma.roomMember.findMany({ where: { roomId } });
    return members.map((member) => ({ id: member.userId, name: member.name }));
  }

  async join(user: RequestUser, roomId: string) {
    const room = await this.prisma.room.findUnique({ where: { id: roomId } });
    if (!room) throw new NotFoundException({ error: 'Room not found' });
    const existing = await this.prisma.roomMember.findUnique({
      where: { roomId_userId: { roomId, userId: user.id } },
    });
    await this.prisma.roomMember.upsert({
      where: { roomId_userId: { roomId, userId: user.id } },
      update: { name: user.name },
      create: { roomId, userId: user.id, name: user.name },
    });
    return { ok: true, roomId, alreadyMember: Boolean(existing) };
  }

  async send(user: RequestUser, roomId: string, dto: SendMessageDto) {
    const text = dto.text?.trim() || '';
    if (!text && !dto.attachment) {
      throw new BadRequestException({ error: 'text is required' });
    }
    await this.join(user, roomId);
    const message = await this.prisma.message.create({
      data: {
        roomId,
        authorId: user.id,
        authorName: dto.authorName || user.name,
        text,
        attachment: dto.attachment || null,
      },
    });
    return {
      id: message.id,
      authorId: message.authorId,
      authorName: message.authorName,
      text: message.text,
      createdAt: message.createdAt.toISOString(),
      attachment: message.attachment ? JSON.parse(message.attachment) : undefined,
    };
  }

  async deleteMessage(user: RequestUser, roomId: string, messageId: string) {
    const message = await this.prisma.message.findFirst({
      where: { id: messageId, roomId },
    });
    if (!message) throw new NotFoundException({ error: 'Message not found' });
    if (user.role !== 'admin' && message.authorId !== user.id) {
      throw new ForbiddenException({ error: 'Not allowed' });
    }
    await this.prisma.message.delete({ where: { id: messageId } });
    return { ok: true };
  }

  async vote(user: RequestUser, roomId: string, messageId: string, optionIndex: number) {
    const message = await this.prisma.message.findFirst({ where: { id: messageId, roomId } });
    if (!message?.attachment) throw new NotFoundException({ error: 'Poll not found' });
    const attachment = JSON.parse(message.attachment) as {
      pollOptions?: { text: string; votes: number; votedBy?: string[] }[];
    };
    if (!attachment.pollOptions?.[optionIndex]) {
      throw new BadRequestException({ error: 'Invalid poll option' });
    }
    const alreadyVoted = attachment.pollOptions.some((option) => option.votedBy?.includes(user.id));
    if (alreadyVoted) throw new BadRequestException({ error: 'ALREADY_VOTED' });
    attachment.pollOptions = attachment.pollOptions.map((option, index) =>
      index === optionIndex
        ? { ...option, votes: (option.votes ?? 0) + 1, votedBy: [...(option.votedBy ?? []), user.id] }
        : option,
    );
    await this.prisma.message.update({
      where: { id: messageId },
      data: { attachment: JSON.stringify(attachment) },
    });
    return { ok: true };
  }

  async reportMessage(user: RequestUser, messageId: string) {
    const message = await this.prisma.message.findUnique({ where: { id: messageId } });
    if (!message) throw new NotFoundException({ error: 'Message not found' });
    await this.prisma.messageReport.upsert({
      where: { messageId_reporterId: { messageId, reporterId: user.id } },
      update: {},
      create: { messageId, reporterId: user.id },
    });
    return { ok: true };
  }
}
