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
      cookies: `buvid3=392113AD-D4D7-1C8A-0B80-773F3014A15273548infoc; b_nut=1756525273; _uuid=CC535FF10-61B4-B696-5F103-868BA63B82F1073979infoc; enable_web_push=DISABLE; buvid_fp=5c9bae0d79d5d2bc608d9e31a9833fc8; buvid4=6B52B28C-8E5D-29FA-F6D1-6B25865DB17374530-025083011-pfN0ip/xW+ThcVM9+tR3CA%3D%3D; theme-tip-show=SHOWED; rpdid=|(ku|l|Y~Juk0J'u~lYlJk|Jk; hit-dyn-v2=1; LIVE_BUVID=AUTO8317566559935045; CURRENT_QUALITY=120; theme-avatar-tip-show=SHOWED; CURRENT_FNVAL=4048; theme_style=light; b_lsid=A5F72753_19AB3A5C4CB; PVID=1; bili_ticket=eyJhbGciOiJIUzI1NiIsImtpZCI6InMwMyIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NjQyMDk3ODUsImlhdCI6MTc2Mzk1MDUyNSwicGx0IjotMX0.5w09Cf20dGvScUjkSANqhL7N8jLSUhGuTj_6I25p3E8; bili_ticket_expires=1764209725; SESSDATA=4d6d9c68%2C1779502853%2C1db32%2Ab1CjCWqy7xKccrjFBsEtrWIpaw8xz0rXRRVvY25fVtl9eanjgGgxoJSHUYw1FEqiSXwNASVllRUmlGMkZHWVRfd0pIOXlBSlhYa2x6cWI3NC0xOTdsc2pQTkZiMXNzSDE4R04xYkdrb3JVd043VGpxY1lBVlRZYzBlbUhpbWhlVF9LazNjdFFXQVNBIIEC; bili_jct=e4e82310392c699ea921b98851eea828; DedeUserID=291659259; DedeUserID__ckMd5=4a5056e59ea0b7eb; sid=5l838ig0; home_feed_column=5; browser_resolution=1459-150`,
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
