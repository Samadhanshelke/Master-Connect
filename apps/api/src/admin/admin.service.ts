import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async overview() {
    const [cities, users, posts, rooms, shops, jobs, pendingBanners, openReports] =
      await Promise.all([
        this.prisma.city.count(),
        this.prisma.user.count(),
        this.prisma.post.count(),
        this.prisma.room.count(),
        this.prisma.shop.count(),
        this.prisma.job.count(),
        this.prisma.banner.count({ where: { status: 'pending' } }),
        this.prisma.report.count({ where: { status: { not: 'resolved' } } }),
      ]);

    return { cities, users, posts, rooms, shops, jobs, pendingBanners, openReports };
  }
}
