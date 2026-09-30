import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { SetRoleDto, UpdateMeDto } from './dto';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private auth: AuthService,
  ) {}

  list() {
    return this.prisma.user.findMany({ orderBy: { createdAt: 'desc' } }).then((users) =>
      users.map((user) => this.auth.toAuthUser(user)),
    );
  }

  async updateMe(userId: string, dto: UpdateMeDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.location !== undefined ? { location: dto.location } : {}),
        ...(dto.bio !== undefined ? { bio: dto.bio } : {}),
        ...(dto.onboardingCompleted !== undefined
          ? { onboardingCompleted: dto.onboardingCompleted }
          : {}),
      },
    });
    return this.auth.toAuthUser(user);
  }

  async setRole(userId: string, dto: SetRoleDto) {
    const existing = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!existing) throw new NotFoundException({ error: 'User not found' });
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { role: dto.role },
    });
    return this.auth.toAuthUser(user);
  }

  async social(userId: string) {
    const [following, followers, bookmarks] = await Promise.all([
      this.prisma.follow.findMany({ where: { followerId: userId } }),
      this.prisma.follow.findMany({ where: { followingId: userId } }),
      this.prisma.bookmark.findMany({ where: { userId } }),
    ]);
    return {
      followingIds: following.map((item) => item.followingId),
      followerIds: followers.map((item) => item.followerId),
      bookmarkIds: bookmarks.map((item) => item.postId),
    };
  }

  async setFollow(userId: string, targetId: string, active: boolean) {
    if (userId === targetId) return { ok: true };
    const target = await this.prisma.user.findUnique({ where: { id: targetId } });
    if (!target) throw new NotFoundException({ error: 'User not found' });
    if (active) {
      await this.prisma.follow.upsert({
        where: { followerId_followingId: { followerId: userId, followingId: targetId } },
        update: {},
        create: { followerId: userId, followingId: targetId },
      });
    } else {
      await this.prisma.follow.deleteMany({ where: { followerId: userId, followingId: targetId } });
    }
    return { ok: true };
  }

  async setBookmark(userId: string, postId: string, active: boolean) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException({ error: 'Post not found' });
    if (active) {
      await this.prisma.bookmark.upsert({
        where: { userId_postId: { userId, postId } },
        update: {},
        create: { userId, postId },
      });
    } else {
      await this.prisma.bookmark.deleteMany({ where: { userId, postId } });
    }
    return { ok: true };
  }
}
