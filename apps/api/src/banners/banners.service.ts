import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBannerDto, SetBannerStatusDto } from './dto';
import { RequestUser } from '../common/decorators/current-user.decorator';
import { Banner } from '@prisma/client';

@Injectable()
export class BannersService {
  constructor(private prisma: PrismaService) {}

  map(banner: Banner) {
    return {
      id: banner.id,
      ownerId: banner.ownerId,
      ownerName: banner.ownerName,
      date: banner.date,
      imageUri: banner.imageUri,
      status: banner.status,
      paymentStatus: banner.paymentStatus,
      price: banner.price,
      createdAt: banner.createdAt.toISOString(),
      paidAt: banner.paidAt ? banner.paidAt.toISOString() : null,
    };
  }

  async list() {
    const banners = await this.prisma.banner.findMany({ orderBy: { date: 'desc' } });
    return banners.map((banner) => this.map(banner));
  }

  async create(user: RequestUser, dto: CreateBannerDto) {
    const blocking = await this.prisma.banner.findFirst({
      where: { date: dto.date, status: { not: 'rejected' } },
    });
    if (blocking) {
      throw new ConflictException({ error: 'This date is already booked' });
    }
    const banner = await this.prisma.banner.create({
      data: {
        ownerId: user.id,
        ownerName: dto.ownerName || user.name,
        date: dto.date,
        imageUri: dto.imageUri || '',
        status: user.role === 'admin' ? 'approved' : 'pending',
      },
    });
    return this.map(banner);
  }

  async pay(user: RequestUser, id: string) {
    const banner = await this.prisma.banner.findUnique({ where: { id } });
    if (!banner) throw new NotFoundException({ error: 'Banner not found' });
    if (user.role !== 'admin' && banner.ownerId !== user.id) {
      throw new ForbiddenException({ error: 'Not allowed' });
    }
    return this.map(
      await this.prisma.banner.update({
        where: { id },
        data: { paymentStatus: 'paid', paidAt: new Date() },
      }),
    );
  }

  async setStatus(id: string, dto: SetBannerStatusDto) {
    const banner = await this.prisma.banner.findUnique({ where: { id } });
    if (!banner) throw new NotFoundException({ error: 'Banner not found' });
    return this.map(
      await this.prisma.banner.update({ where: { id }, data: { status: dto.status } }),
    );
  }

  async remove(id: string) {
    const banner = await this.prisma.banner.findUnique({ where: { id } });
    if (!banner) throw new NotFoundException({ error: 'Banner not found' });
    await this.prisma.banner.delete({ where: { id } });
    return { ok: true };
  }
}
