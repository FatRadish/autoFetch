import prisma from '../lib/prisma.js';
import bcrypt from 'bcryptjs';
import { generateToken } from '../middleware/auth.js';
import {
  UnauthorizedError,
  ValidationError,
  type AuthResponse,
} from '../types/index.js';

export class AuthService {
  /**
   * 用户登录
   */
  static async login(
    username: string,
    password: string
  ): Promise<AuthResponse> {
    // 查找用户
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      throw new ValidationError('账号或者密码错误');
    }

    // 验证密码
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new ValidationError('账号或者密码错误');
    }

    // 生成 token
    const token = generateToken({
      userId: user.id,
      username: user.username,
      role: user.role,
    });

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email || undefined,
        role: user.role,
      },
    };
  }

  /**
   * 创建用户
   */
  static async createUser(data: {
    username: string;
    password: string;
    email?: string;
    role?: string;
  }): Promise<{ id: string; username: string; email?: string; role: string }> {
    // 检查用户名是否已存在
    const existing = await prisma.user.findUnique({
      where: { username: data.username },
    });

    if (existing) {
      throw new ValidationError('Username already exists');
    }

    // 检查邮箱是否已存在
    if (data.email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email: data.email },
      });

      if (existingEmail) {
        throw new ValidationError('Email already exists');
      }
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // 创建用户
    const user = await prisma.user.create({
      data: {
        username: data.username,
        password: hashedPassword,
        email: data.email,
        role: data.role || 'user',
      },
    });

    return {
      id: user.id,
      username: user.username,
      email: user.email || undefined,
      role: user.role,
    };
  }

  /**
   * 获取用户信息
   */
  static async getUserById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new ValidationError('User not found');
    }

    return user;
  }
}
