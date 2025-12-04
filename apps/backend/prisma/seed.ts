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
        name: 'bilibili',
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
      // 在 platformTask 表插入初始数据，并与平台关联
      const platformTask = await prisma.platformTask.upsert({
        where: { key: 'bilibili_vip_privilege' },
        update: {},
        create: {
          platformId: platform.id, // 关联平台
          name: 'B站大会员权益领取',
          key: 'bilibili_vip_privilege',
        },
      });
      logger.info(`Created platform:${platform.name}`)
      logger.info(`Created platformTask:${platformTask.name}`)
    }
    //平台任务
    logger.info(`Database seeding completed!`)
  } catch (error) {
    logger.error(`seed is error${error}`)
  } finally {
    await prisma.$disconnect();
  }
}
