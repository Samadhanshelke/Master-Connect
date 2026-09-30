import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CommentDto, CreatePostDto, ReportPostDto } from './dto';
import { RequestUser } from '../common/decorators/current-user.decorator';
import { Post, Comment, PostLike } from '@prisma/client';

type PostWithRelations = Post & { comments: Comment[]; likes: PostLike[] };

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}

  map(post: PostWithRelations) {
    return {
      id: post.id,
      authorId: post.authorId,
      authorName: post.authorName,
      content: post.content,
      visibility: post.visibility,
      location: post.location,
      likesCount: post.likes.length,
      likedBy: post.likes.map((like) => like.userId),
      comments: post.comments.map((comment) => ({
        id: comment.id,
        authorId: comment.authorId,
        user: comment.user,
        text: comment.text,
        createdAt: comment.createdAt.toISOString(),
      })),
      createdAt: post.createdAt.toISOString(),
      attachment: post.attachment ? JSON.parse(post.attachment) : null,
    };
  }

  private include() {
    return { comments: { orderBy: { createdAt: 'asc' as const } }, likes: true };
  }

  async list(city?: string, authorId?: string) {
    const posts = await this.prisma.post.findMany({
      where: authorId ? { authorId } : undefined,
      include: this.include(),
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return posts
      .filter((post) => authorId || post.visibility === 'global' || !city || post.location === city)
      .map((post) => this.map(post));
  }

  async get(id: string) {
    const post = await this.prisma.post.findUnique({ where: { id }, include: this.include() });
    if (!post) return null;
    return this.map(post);
  }

  async create(user: RequestUser, dto: CreatePostDto) {
    const content = dto.content?.trim() || '';
    if (!content && !dto.attachment) {
      throw new BadRequestException({ error: 'content is required' });
    }
    const post = await this.prisma.post.create({
      data: {
        authorId: user.id,
        authorName: dto.authorName || user.name,
        content,
        visibility: dto.visibility === 'global' ? 'global' : 'local',
        location: dto.location || '',
        attachment: dto.attachment || null,
      },
      include: this.include(),
    });
    return this.map(post);
  }

  async remove(user: RequestUser, id: string) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) throw new NotFoundException({ error: 'Post not found' });
    if (user.role !== 'admin' && post.authorId !== user.id) {
      throw new ForbiddenException({ error: 'Not allowed' });
    }
    await this.prisma.post.delete({ where: { id } });
    return { ok: true };
  }

  async toggleLike(user: RequestUser, id: string) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) throw new NotFoundException({ error: 'Post not found' });
    const existing = await this.prisma.postLike.findUnique({
      where: { postId_userId: { postId: id, userId: user.id } },
    });
    if (existing) {
      await this.prisma.postLike.delete({
        where: { postId_userId: { postId: id, userId: user.id } },
      });
      await this.prisma.notification.deleteMany({
        where: { type: 'like', postId: id, actorId: user.id },
      });
    } else {
      await this.prisma.postLike.create({ data: { postId: id, userId: user.id } });
      if (post.authorId !== user.id) {
        await this.prisma.notification.create({
          data: {
            type: 'like',
            recipientId: post.authorId,
            actorId: user.id,
            actorName: user.name,
            message: `${user.name} liked your post`,
            postId: id,
          },
        });
      }
    }
    const next = await this.prisma.post.findUniqueOrThrow({
      where: { id },
      include: this.include(),
    });
    return this.map(next);
  }

  async comment(user: RequestUser, id: string, dto: CommentDto) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) throw new NotFoundException({ error: 'Post not found' });
    await this.prisma.comment.create({
      data: {
        postId: id,
        authorId: user.id,
        user: user.name,
        text: dto.text.trim(),
      },
    });
    if (post.authorId !== user.id) {
      await this.prisma.notification.create({
        data: {
          type: 'comment',
          recipientId: post.authorId,
          actorId: user.id,
          actorName: user.name,
          message: `${user.name} commented on your post`,
          postId: id,
        },
      });
    }
    const next = await this.prisma.post.findUniqueOrThrow({
      where: { id },
      include: this.include(),
    });
    return this.map(next);
  }

  async report(user: RequestUser, id: string, dto: ReportPostDto) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) throw new NotFoundException({ error: 'Post not found' });
    const report = await this.prisma.report.create({
      data: {
        postId: id,
        reporterId: user.id,
        authorId: post.authorId,
        content: dto.content || post.content,
      },
    });
    return {
      id: report.id,
      postId: report.postId,
      reporterId: report.reporterId,
      authorId: report.authorId,
      content: report.content,
      status: report.status,
      createdAt: report.createdAt.toISOString(),
    };
  }
}
