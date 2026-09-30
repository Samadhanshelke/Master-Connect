import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateJobDto, SetJobStatusDto } from './dto';
import { RequestUser } from '../common/decorators/current-user.decorator';
import { Job } from '@prisma/client';

@Injectable()
export class JobsService {
  constructor(private prisma: PrismaService) {}

  map(job: Job) {
    return {
      id: job.id,
      ownerId: job.ownerId,
      orgName: job.orgName,
      position: job.position,
      contact: job.contact,
      address: job.address,
      city: job.city,
      status: job.status,
      createdAt: job.createdAt.toISOString(),
    };
  }

  async list(city?: string) {
    const jobs = await this.prisma.job.findMany({
      where: city ? { city } : undefined,
      orderBy: { createdAt: 'desc' },
    });
    return jobs.map((job) => this.map(job));
  }

  async create(user: RequestUser, dto: CreateJobDto) {
    const job = await this.prisma.job.create({
      data: {
        ownerId: user.id,
        orgName: dto.orgName.trim(),
        position: dto.position.trim(),
        contact: dto.contact || '',
        city: dto.city,
        address: dto.city,
      },
    });
    return this.map(job);
  }

  async setStatus(user: RequestUser, id: string, dto: SetJobStatusDto) {
    const job = await this.prisma.job.findUnique({ where: { id } });
    if (!job) throw new NotFoundException({ error: 'Job not found' });
    if (user.role !== 'admin' && job.ownerId !== user.id) {
      throw new ForbiddenException({ error: 'Not allowed' });
    }
    return this.map(
      await this.prisma.job.update({ where: { id }, data: { status: dto.status } }),
    );
  }

  async remove(user: RequestUser, id: string) {
    const job = await this.prisma.job.findUnique({ where: { id } });
    if (!job) throw new NotFoundException({ error: 'Job not found' });
    if (user.role !== 'admin' && job.ownerId !== user.id) {
      throw new ForbiddenException({ error: 'Not allowed' });
    }
    await this.prisma.job.delete({ where: { id } });
    return { ok: true };
  }
}
