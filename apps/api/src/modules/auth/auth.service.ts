import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && !user.deletedAt) {
      const isMatch = await bcrypt.compare(pass, user.passwordHash);
      if (isMatch) {
        const { passwordHash, ...result } = user;
        return result;
      }
    }
    return null;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    
    const payload = { email: user.email, sub: user.id, role: user.role, businessId: user.businessId };
    return {
      access_token: this.jwtService.sign(payload),
      user,
    };
  }

  async register(registerDto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(registerDto.password, salt);

    // Create Business, Branch, Setting, and User in a transaction
    const newUser = await this.prisma.$transaction(async (tx) => {
      // 1. Create Business
      const business = await tx.business.create({
        data: {
          name: registerDto.businessName,
          slug: registerDto.businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.floor(Math.random() * 10000),
          email: registerDto.email,
          phone: registerDto.phone,
        },
      });

      // 2. Create Default Branch
      const branch = await tx.branch.create({
        data: {
          businessId: business.id,
          name: 'Main Branch',
        },
      });

      // 3. Create Default Settings (AI config without strict safeties for easy onboarding)
      await tx.setting.create({
        data: {
          businessId: business.id,
          businessName: business.name,
          businessHours: {},
          aiConfig: { requireWhitelist: false, whitelistedNumbers: [] },
          notificationConfig: {},
          generalConfig: {},
        },
      });

      // 4. Create User as BUSINESS_OWNER
      const user = await tx.user.create({
        data: {
          email: registerDto.email,
          passwordHash,
          phone: registerDto.phone,
          role: 'BUSINESS_OWNER',
          businessId: business.id,
        },
      });

      // 5. Create Employee profile for the owner
      await tx.employee.create({
        data: {
          businessId: business.id,
          branchId: branch.id,
          userId: user.id,
          name: registerDto.name,
          email: registerDto.email,
          phone: registerDto.phone,
          title: 'Owner',
        },
      });

      return user;
    });

    const payload = { email: newUser.email, sub: newUser.id, role: newUser.role, businessId: newUser.businessId };
    return {
      access_token: this.jwtService.sign(payload),
      user: newUser,
    };
  }

  // Very simple refresh implementation
  async refresh(user: any) {
    const payload = { email: user.email, sub: user.userId, role: user.role, businessId: user.businessId };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
