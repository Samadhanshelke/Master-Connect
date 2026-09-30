import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

function slugifyCity(city: string) {
  return (
    city
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'city'
  );
}

async function main() {
  const passwordHash = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@masterconnect.local' },
    update: { role: 'admin', passwordHash },
    create: {
      email: 'admin@masterconnect.local',
      passwordHash,
      name: 'Admin',
      role: 'admin',
      location: 'Pune',
      onboardingCompleted: true,
    },
  });

  for (const name of ['Pune', 'Mumbai']) {
    const slug = slugifyCity(name);
    const city = await prisma.city.upsert({
      where: { slug },
      update: {},
      create: { name, slug, createdBy: admin.id },
    });
    const roomId = `group_${city.slug}`;
    await prisma.room.upsert({
      where: { id: roomId },
      update: {},
      create: {
        id: roomId,
        name: `${name} City Chat`,
        city: name,
        type: 'group',
      },
    });
  }

  console.log('Seeded admin@masterconnect.local / admin123 and cities Pune, Mumbai');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
