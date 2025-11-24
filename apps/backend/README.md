# AutoFetch Backend

AutoFetch 后端服务 - 基于 Node.js + TypeScript + Express + Prisma 构建的自动化福利领取系统后端。

## 技术栈

- **Node.js 20+** - 运行时环境
- **TypeScript** - 类型安全的 JavaScript
- **Express** - Web 框架
- **Prisma** - ORM 数据库工具
- **SQLite** - 数据库（可切换为 PostgreSQL）
- **JWT** - 身份认证
- **Winston** - 日志系统
- **Zod** - 数据验证
- **Axios** - HTTP 客户端

## 项目结构

```
apps/backend/
├── prisma/
│   ├── schema.prisma       # 数据库模型定义
│   ├── prisma.config.ts    # Prisma 配置
│   └── seed.ts             # 数据库种子数据
├── src/
│   ├── adapters/           # 平台适配器
│   │   ├── base.ts         # 基础适配器类
│   │   ├── http.ts         # HTTP 适配器
│   │   ├── registry.ts     # 适配器注册表
│   │   └── platforms/      # 具体平台实现
│   │       └── jd.ts       # 京东适配器示例
│   ├── config/             # 配置管理
│   │   └── index.ts
│   ├── lib/                # 共享库
│   │   └── prisma.ts       # Prisma 客户端实例
│   ├── middleware/         # 中间件
│   │   ├── auth.ts         # JWT 认证
│   │   ├── error.ts        # 错误处理
│   │   └── ratelimit.ts    # 限流
│   ├── routes/             # API 路由
│   │   ├── auth.ts         # 认证路由
│   │   ├── platforms.ts    # 平台管理
│   │   └── accounts.ts     # 账号管理
│   ├── services/           # 业务逻辑层
│   │   ├── AuthService.ts
│   │   ├── PlatformService.ts
│   │   └── AccountService.ts
│   ├── types/              # 类型定义
│   │   └── index.ts
│   ├── utils/              # 工具函数
│   │   ├── cookie.ts       # Cookie 处理
│   │   ├── encrypt.ts      # 加密解密
│   │   ├── logger.ts       # 日志工具
│   │   ├── notification.ts # 通知服务
│   │   └── validator.ts    # 数据验证
│   └── app.ts              # 应用入口
├── .env.example            # 环境变量示例
├── .eslintrc.cjs           # ESLint 配置
├── package.json
└── tsconfig.json           # TypeScript 配置
```

## 快速开始

### 1. 安装依赖

```bash
cd apps/backend
pnpm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
# 服务器配置
PORT=3001
NODE_ENV=development

# 数据库
DATABASE_URL="file:./dev.db"

# JWT 密钥（请在生产环境中更改）
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=7d

# 加密密钥（请在生产环境中更改）
ENCRYPTION_SECRET=your-super-secret-encryption-key-change-this

# CORS
CORS_ORIGIN=*

# 日志
LOG_LEVEL=info
```

### 3. 初始化数据库

```bash
# 生成 Prisma 客户端
pnpm prisma:generate

# 运行数据库迁移
pnpm prisma:migrate

# 可选：导入种子数据
pnpm prisma db seed
```

### 4. 启动开发服务器

```bash
pnpm dev
```

服务器将在 `http://localhost:3001` 启动。

## API 文档

### 认证接口

#### 登录
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

#### 注册
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "newuser",
  "password": "password123",
  "email": "user@example.com"
}
```

#### 获取当前用户
```http
GET /api/auth/me
Authorization: Bearer <token>
```

### 平台管理

#### 获取所有平台
```http
GET /api/platforms
Authorization: Bearer <token>
```

#### 获取单个平台
```http
GET /api/platforms/:id
Authorization: Bearer <token>
```

#### 创建平台（需要管理员权限）
```http
POST /api/platforms
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "京东",
  "icon": "jd",
  "description": "京东签到领京豆",
  "adapterType": "http",
  "config": {
    "checkInUrl": "https://api.m.jd.com/client.action"
  }
}
```

### 账号管理

#### 获取所有账号
```http
GET /api/accounts
Authorization: Bearer <token>
```

#### 创建账号
```http
POST /api/accounts
Authorization: Bearer <token>
Content-Type: application/json

{
  "platformId": "clxxx...",
  "name": "我的京东账号",
  "cookies": "pt_key=xxx; pt_pin=xxx;",
  "userAgent": "Mozilla/5.0...",
  "headers": {},
  "proxy": {
    "enabled": false
  }
}
```

## 开发指南

### 添加新的平台适配器

1. 在 `src/adapters/platforms/` 创建新文件，例如 `taobao.ts`：

```typescript
import { HttpAdapter } from '../http.js';
import type { ExecutionContext, ExecutionResult } from '../../types/index.js';

export class TaobaoAdapter extends HttpAdapter {
  readonly name = 'taobao';

  async execute(context: ExecutionContext): Promise<ExecutionResult> {
    try {
      this.validateContext(context);

      // 实现签到逻辑
      const response = await this.post(
        'https://api.taobao.com/checkin',
        {},
        context
      );

      return {
        success: true,
        message: '签到成功',
        data: response,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }
}
```

2. 在 `src/adapters/registry.ts` 中注册：

```typescript
import { TaobaoAdapter } from './platforms/taobao.js';

export function registerBuiltinAdapters(): void {
  adapterRegistry.register('taobao', TaobaoAdapter);
  adapterRegistry.register('淘宝', TaobaoAdapter);
}
```

### 数据库迁移

当修改 Prisma schema 后：

```bash
# 创建迁移
pnpm prisma:migrate

# 查看数据库
pnpm prisma:studio
```

### 代码检查和格式化

```bash
# 运行 ESLint
pnpm lint

# 格式化代码
pnpm format
```

### 构建生产版本

```bash
# 编译 TypeScript
pnpm build

# 启动生产服务器
pnpm start
```

## 安全注意事项

1. **JWT 密钥**：在生产环境中必须使用强随机密钥
2. **加密密钥**：用于加密 Cookie 等敏感信息，务必保密
3. **CORS 配置**：生产环境应限制允许的来源
4. **限流**：已配置基础限流，可根据需要调整
5. **日志脱敏**：敏感信息不会记录到日志中

## 环境变量说明

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| PORT | 服务器端口 | 3001 |
| HOST | 服务器主机 | 0.0.0.0 |
| NODE_ENV | 运行环境 | development |
| DATABASE_URL | 数据库连接 | file:./dev.db |
| JWT_SECRET | JWT 密钥 | - |
| JWT_EXPIRES_IN | JWT 过期时间 | 7d |
| ENCRYPTION_SECRET | 加密密钥 | - |
| CORS_ORIGIN | CORS 来源 | * |
| LOG_LEVEL | 日志级别 | info |

## 常见问题

### 1. 数据库连接失败

确保 `DATABASE_URL` 配置正确，SQLite 会自动创建数据库文件。

### 2. JWT 验证失败

检查 `JWT_SECRET` 是否正确配置，确保前后端使用相同的密钥。

### 3. Cookie 解密失败

检查 `ENCRYPTION_SECRET` 是否正确，确保密钥没有更改。

## License

MIT
