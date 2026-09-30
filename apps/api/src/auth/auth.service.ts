import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RegisterDto } from './dto';
import { User } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  toAuthUser(user: User) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      location: user.location,
      bio: user.bio,
      onboardingCompleted: user.onboardingCompleted,
      createdAt: user.createdAt.toISOString(),
    };
  }

  private async sign(user: User) {
    const token = await this.jwt.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
    return { token, user: this.toAuthUser(user) };
  }

  private bootstrapRole(email: string, requested?: string) {
    const bootstrap = (this.config.get<string>('ADMIN_BOOTSTRAP_EMAIL') || '').toLowerCase();
    if (bootstrap && email.toLowerCase() === bootstrap) {
      return 'admin';
    }
    return requested || 'citizen';
  }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
    if (existing) {
      throw new ConflictException({ error: 'An account with this email already exists' });
    }
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        name: dto.name,
        location: dto.location || '',
        role: this.bootstrapRole(dto.email),
      },
    });
    await this.prisma.notification.create({
      data: {
        clientKey: `welcome_${user.id}`,
        type: 'system',
        recipientId: user.id,
        actorId: user.id,
        actorName: 'Master Connect',
        message: 'Welcome to the community',
      },
    });
    return this.sign(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (!user?.passwordHash) {
      throw new UnauthorizedException({ error: 'Invalid email or password' });
    }
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException({ error: 'Invalid email or password' });
    }
    const role = this.bootstrapRole(user.email, user.role);
    const next =
      role !== user.role
        ? await this.prisma.user.update({ where: { id: user.id }, data: { role } })
        : user;
    return this.sign(next);
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException({ error: 'User not found' });
    return this.toAuthUser(user);
  }
}
