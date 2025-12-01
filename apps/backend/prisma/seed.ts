import prisma from '../src/lib/prisma'
import bcrypt from 'bcryptjs';
import logger from '@/utils/logger';

export default async function seed() {
  try {
    logger.info('Starting database seeding...')

    // 创建默认管理员用户
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.upsert({
      where: { username: 'admin' },
      update: {},
      create: {
        username: 'admin',
        password: hashedPassword,
        email: 'admin@autofetch.local',
        role: 'admin',
      },
    });
    logger.info(`Created admin user:${admin.username}`)

    // 创建示例平台
    const platforms = [
      {
        name: 'B站',
        icon: 'bilibili',
        description: 'B站签到领取B币、大会员权益',
        adapterType: 'browser',
        config: JSON.stringify({
          baseUrl: 'https://www.bilibili.com',
          checkInUrl: 'https://api.bilibili.com/x/member/web/sign/updo',
          vipPrivilegeUrl: 'https://api.bilibili.com/x/vip/privilege/receive',
        }),
      },
    ];

    for (const platformData of platforms) {
      const platform = await prisma.platform.upsert({
        where: { name: platformData.name },
        update: {},
        create: platformData,
      });
      logger.info(`Created platform:${platform.name}`)
    }
    logger.info(`Database seeding completed!`)
  } catch (error) {
    logger.error(`seed is error${error}`)
  } finally {
    await prisma.$disconnect();
  }
}
