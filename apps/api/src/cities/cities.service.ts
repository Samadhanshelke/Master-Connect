import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCityDto } from './dto';

function slugifyCity(city: string) {
  return (
    city
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'city'
  );
}

export function groupRoomId(city: string) {
  return `group_${slugifyCity(city)}`;
}

@Injectable()
export class CitiesService {
  constructor(private prisma: PrismaService) {}

  map(city: { id: string; name: string; slug: string; createdAt: Date; createdBy: string }) {
    return {
      id: city.id,
      name: city.name,
      slug: city.slug,
      createdAt: city.createdAt.toISOString(),
      createdBy: city.createdBy,
    };
  }

  async list() {
    const cities = await this.prisma.city.findMany({ orderBy: { name: 'asc' } });
    return cities.map((city) => this.map(city));
  }

  async create(userId: string, dto: CreateCityDto) {
    const name = dto.name.trim();
    const slug = slugifyCity(name);
    const existing = await this.prisma.city.findFirst({
      where: { OR: [{ name }, { slug }] },
    });
    if (existing) {
      throw new ConflictException({ error: 'This city already exists' });
    }

    const city = await this.prisma.city.create({
      data: { name, slug, createdBy: userId },
    });

    const roomId = groupRoomId(name);
    await this.prisma.room.upsert({
      where: { id: roomId },
      update: {},
      create: {
        id: roomId,
        name: `${name} City Chat`,
        city: name,
        type: 'group',
      },
    });

    return this.map(city);
  }

  async remove(id: string) {
    const city = await this.prisma.city.findUnique({ where: { id } });
    if (!city) throw new NotFoundException({ error: 'City not found' });
    await this.prisma.city.delete({ where: { id } });
    return { ok: true };
  }
}
