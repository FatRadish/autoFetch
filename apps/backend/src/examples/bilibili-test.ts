import { adapterRegistry } from '../adapters/registry';
import type { ExecutionContext } from '../types/index';

/**
 * B站适配器测试示例
 *
 * 使用方法：
 * 1. 修改下面的 cookies 和 userAgent 为你的真实值
 * 2. 运行：pnpm tsx src/examples/bilibili-test.ts
 */

async function testBilibiliAdapter() {
  console.log('开始测试 B站适配器...\n');

  // 获取 B站适配器
  const adapter = adapterRegistry.get('bilibili');

  if (!adapter) {
    console.error('❌ B站适配器未注册');
    return;
  }

  console.log('✓ B站适配器已注册');

  // 构造测试上下文
  const context: ExecutionContext = {
    account: {
      id: 'test-account-id',
      name: '测试账户',
      // ⚠️ 请替换为你的真实 Cookies
      cookies: `buvid3=392113AD-D4D7-1C8A-0B80-773F3014A15273548infoc; b_nut=1756525273; _uuid=CC535FF10-61B4-B696-5F103-868BA63B82F1073979infoc; enable_web_push=DISABLE; buvid_fp=5c9bae0d79d5d2bc608d9e31a9833fc8; buvid4=6B52B28C-8E5D-29FA-F6D1-6B25865DB17374530-025083011-pfN0ip/xW+ThcVM9+tR3CA%3D%3D; theme-tip-show=SHOWED; rpdid=|(ku|l|Y~Juk0J'u~lYlJk|Jk; hit-dyn-v2=1; LIVE_BUVID=AUTO8317566559935045; CURRENT_QUALITY=120; theme-avatar-tip-show=SHOWED; CURRENT_FNVAL=4048; theme_style=light; PVID=1; DedeUserID=291659259; DedeUserID__ckMd5=4a5056e59ea0b7eb; home_feed_column=5; browser_resolution=1459-150; b_lsid=B8BC4C7C_19AD905990C; bsource=search_google; SESSDATA=9f621a4b%2C1780129616%2Cab232%2Ac2CjA_7aSeGaUUFYSNPbczpy6KnB_fPu6-Ri2iArsn6hm1azHT7uP4Ml2MIP07s28DOQUSVnNVaUJhQ29nU0NVZUJaQm11SG5wUE9tNGN2ZkpQakptNFZwRFZ2YnA5dGhBMTJoVzZJTzR1dU10QWFlbUNoNVRQLWVQckF4RjhlQi1fLVVxaUd0X1N3IIEC; bili_jct=dc6ce12263c71c8b59bbc68589defb9d; sid=oypy44hw; bili_ticket=eyJhbGciOiJIUzI1NiIsImtpZCI6InMwMyIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NjUwOTQyMjcsImlhdCI6MTc2NDgzNDk2NywicGx0IjotMX0.2qMeJN3IXo-170jLPhPAOteGi3bfBzCvf2XFButcyOU; bili_ticket_expires=1765094167`,
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36',
      headers: {
        Referer: 'https://account.bilibili.com/account/big/myPackage',
      },
    },
    task: {
      id: 'test-task-id',
      name: 'B站每日签到',
      config: {
        checkInUrl: 'https://account.bilibili.com/account/big/myPackage',
        dailyCoins: 0, // 不投币
      },
      retryTimes: 3,
      timeout: 30000,
    },
    platform: {
      id: 'bilibili-platform-id',
      name: 'B站',
      adapterType: 'browser',
      config: {},
    },
  };

  try {
    console.log('正在执行签到任务...\n');

    // 执行适配器
    const result = await adapter.execute(context);

    console.log('\n执行结果：');
    console.log('━'.repeat(50));
    console.log(`状态: ${result.success ? '✓ 成功' : '✗ 失败'}`);
    console.log(`消息: ${result.message}`);

    if (result.data) {
      console.log('详细信息:', JSON.stringify(result.data, null, 2));
    }

    if (result.error) {
      console.error('错误信息:', result.error);
    }
    console.log('━'.repeat(50));
  } catch (error) {
    console.error('\n❌ 执行过程中出错:');
    console.error(error);
  }
}

// 运行测试
testBilibiliAdapter().catch(console.error);
