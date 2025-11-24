import { PrismaClient } from '../generated/prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

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
  console.log('Created admin user:', admin.username);

  // 创建示例平台
  const platforms = [
    {
      name: '京东',
      icon: 'jd',
      description: '京东签到领京豆',
      adapterType: 'http',
      config: JSON.stringify({
        checkInUrl: 'https://api.m.jd.com/client.action',
        pointsUrl: 'https://api.m.jd.com/client.action',
      }),
    },
    {
      name: '淘宝',
      icon: 'taobao',
      description: '淘宝签到领淘金币',
      adapterType: 'http',
      config: JSON.stringify({
        checkInUrl: 'https://acs.m.taobao.com/gw/mtop.taobao.idle.user.page.my.info',
      }),
    },
    {
      name: '百度网盘',
      icon: 'baidupan',
      description: '百度网盘签到领会员天数',
      adapterType: 'http',
      config: JSON.stringify({
        checkInUrl: 'https://pan.baidu.com/rest/2.0/membership/user',
      }),
    },
  ];

  for (const platformData of platforms) {
    const platform = await prisma.platform.upsert({
      where: { name: platformData.name },
      update: {},
      create: platformData,
    });
    console.log('Created platform:', platform.name);
  }

  console.log('Database seeding completed!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
