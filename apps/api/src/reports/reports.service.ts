import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ResolveReportDto } from './dto';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async list() {
    const reports = await this.prisma.report.findMany({ orderBy: { createdAt: 'desc' } });
    return reports.map((report) => ({
      id: report.id,
      postId: report.postId,
      reporterId: report.reporterId,
      authorId: report.authorId,
      content: report.content,
      status: report.status,
      createdAt: report.createdAt.toISOString(),
    }));
  }

  async resolve(id: string, dto: ResolveReportDto) {
    const report = await this.prisma.report.findUnique({ where: { id } });
    if (!report) throw new NotFoundException({ error: 'Report not found' });

    await this.prisma.$transaction(async (tx) => {
      await tx.report.update({ where: { id }, data: { status: 'resolved' } });
      if (dto.deletePost && report.postId) {
        await tx.post.delete({ where: { id: report.postId } }).catch(() => undefined);
      }
    });

    return { ok: true };
  }
}
