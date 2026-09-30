import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateShopDto } from './dto';
import { RequestUser } from '../common/decorators/current-user.decorator';
import { Shop, ShopItem } from '@prisma/client';

@Injectable()
export class ShopsService {
  constructor(private prisma: PrismaService) {}

  map(shop: Shop & { items: ShopItem[] }) {
    return {
      id: shop.id,
      ownerId: shop.ownerId,
      ownerName: shop.ownerName,
      name: shop.name,
      category: shop.category,
      description: shop.description,
      location: shop.location,
      city: shop.city,
      contactNumber: shop.contactNumber,
      bannerImage: shop.bannerImage,
      images: JSON.parse(shop.images || '[]'),
      openingTime: shop.openingTime,
      closingTime: shop.closingTime,
      items: shop.items,
      createdAt: shop.createdAt.toISOString(),
    };
  }

  async list(city?: string) {
    const shops = await this.prisma.shop.findMany({
      where: city ? { city } : undefined,
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
    return shops.map((shop) => this.map(shop));
  }

  async get(id: string) {
    const shop = await this.prisma.shop.findUnique({ where: { id }, include: { items: true } });
    if (!shop) return null;
    return this.map(shop);
  }

  async create(user: RequestUser, dto: CreateShopDto) {
    const shop = await this.prisma.shop.create({
      data: {
        ownerId: user.id,
        ownerName: dto.ownerName || user.name,
        name: dto.name.trim(),
        category: dto.category || 'Grocery',
        description: dto.description || '',
        city: dto.city,
        location: dto.location || dto.city,
        contactNumber: dto.contactNumber || '',
        bannerImage: dto.bannerImage || null,
        images: JSON.stringify(dto.images || []),
        openingTime: dto.openingTime || '9:00 AM',
        closingTime: dto.closingTime || '8:00 PM',
        items: {
          create: (dto.items || []).map((item) => ({
            name: item.name,
            price: item.price,
            description: item.description || '',
            type: item.type || 'product',
          })),
        },
      },
      include: { items: true },
    });
    return this.map(shop);
  }

  async remove(user: RequestUser, id: string) {
    const shop = await this.prisma.shop.findUnique({ where: { id } });
    if (!shop) throw new NotFoundException({ error: 'Shop not found' });
    if (user.role !== 'admin' && shop.ownerId !== user.id) {
      throw new ForbiddenException({ error: 'Not allowed' });
    }
    await this.prisma.shop.delete({ where: { id } });
    return { ok: true };
  }
}
