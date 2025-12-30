# AutoFetch - 自动领取福利系统

<div align="center">

一个基于 Web UI 的自动化福利领取系统，支持通过可视化界面配置多平台账号信息，实现定时自动签到和领取各类会员权益。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node Version](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-%3E%3D10-orange)](https://pnpm.io/)

[功能特性](#-功能特性) • [快速开始](#-快速开始) • [项目结构](#-项目结构) • [开发指南](#-开发指南) • [部署](#-部署)

</div>

---

## ✨ 功能特性

- 🎨 **友好的 Web UI** - 基于 React + Shadcn/ui 的现代化管理界面
- 🔐 **安全存储** - Cookie 和敏感信息加密存储，保障账号安全
- ⏰ **灵活调度** - 支持 Cron 表达式的定时任务系统
- 🔌 **插件化设计** - 易于扩展的平台适配器架构
- 📊 **详细日志** - 完整的执行日志和统计数据
- 🔔 **多种通知** - 支持邮件、Webhook 等多种通知方式
- 🐳 **容器化部署** - Docker Compose 一键启动
- 🌐 **国际化支持** - 内置多语言支持

## 🚀 快速开始

### 环境要求

- Node.js >= 20
- pnpm >= 10
- Docker & Docker Compose (可选)

### 使用 Docker (推荐)

```bash
# 克隆项目
git clone https://github.com/FatRadish/autoFetch.git
cd autoFetch

# 启动服务
docker-compose up -d

# 访问应用
# 前端: http://localhost:5173
# 后端: http://localhost:3000
```

### 本地开发

```bash
# 1. 安装依赖
pnpm install

# 2. 配置环境变量
cp apps/backend/.env.example apps/backend/.env
# 编辑 apps/backend/.env 配置必要的环境变量

# 3. 初始化数据库
cd apps/backend
pnpm prisma:migrate
pnpm prisma:generate

# 4. 启动开发服务
cd ../..
pnpm dev
```

访问:

- 前端开发服务器: http://localhost:5173
- 后端 API 服务: http://localhost:3000
- Prisma Studio: `pnpm --filter backend prisma:studio`

## 📁 项目结构

```
autoFetch/
├── apps/
│   ├── backend/              # 后端服务
│   │   ├── src/
│   │   │   ├── adapters/     # 平台适配器
│   │   │   ├── routes/       # API 路由
│   │   │   ├── services/     # 业务逻辑
│   │   │   ├── scheduler/    # 任务调度
│   │   │   ├── middleware/   # 中间件
│   │   │   └── utils/        # 工具函数
│   │   ├── prisma/           # 数据库 Schema 和迁移
│   │   └── tests/            # 测试文件
│   │
│   └── web/                  # 前端应用
│       ├── src/
│       │   ├── pages/        # 页面组件
│       │   ├── components/   # UI 组件
│       │   ├── api/          # API 封装
│       │   ├── hooks/        # 自定义 Hooks
│       │   └── stores/       # 状态管理
│       └── tests/            # E2E 测试
│
├── packages/
│   ├── i18n/                 # 国际化包
│   └── typescript-config/    # TypeScript 配置
│
├── docker-compose.yml        # Docker 编排文件
└── turbo.json               # Turborepo 配置
```

## 🛠 技术栈

### 前端

- **框架**: React 19 + TypeScript
- **UI 库**: Shadcn/ui + Radix UI + Tailwind CSS
- **状态管理**: Zustand / React Query
- **路由**: React Router v7
- **构建工具**: Vite
- **测试**: Playwright (E2E)

### 后端

- **运行时**: Node.js 20+ + TypeScript
- **框架**: Express 5
- **数据库**: SQLite (开发) / PostgreSQL (生产)
- **ORM**: Prisma 7
- **任务调度**: Croner
- **浏览器自动化**: Playwright
- **测试**: Vitest

### 开发工具

- **包管理**: pnpm + Turborepo
- **代码规范**: Oxlint + Oxfmt
- **Git Hooks**: Husky + lint-staged
- **容器化**: Docker + Docker Compose

## 📖 开发指南

### 添加新的平台适配器

1. 在 `apps/backend/src/adapters/platforms/` 创建新的适配器文件:

```typescript
import { BaseAdapter } from '../base';
import { ExecutionContext, ExecutionResult } from '../../types';

export class ExampleAdapter extends BaseAdapter {
  name = 'example';

  async execute(context: ExecutionContext): Promise<ExecutionResult> {
    const { account } = context;

    try {
      // 实现签到逻辑
      const response = await this.makeRequest({
        url: 'https://example.com/api/checkin',
        method: 'POST',
        headers: this.buildHeaders(account),
      });

      return {
        success: true,
        message: '签到成功',
        data: response.data,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }
}
```

2. 在 `apps/backend/src/adapters/registry.ts` 注册适配器
3. 在数据库中添加平台配置
4. 编写测试用例

### 运行测试

```bash
# 后端单元测试
pnpm --filter backend test:unit

# 后端集成测试
pnpm --filter backend test:integration

# 前端 E2E 测试
pnpm --filter web test:e2e

# 查看测试报告
pnpm --filter web test:e2e:report
```

### 代码规范

```bash
# 代码检查
pnpm lint

# 自动修复
pnpm lint:fix

# 代码格式化
pnpm format

# 检查格式
pnpm format:check
```

## 🐳 部署

### Docker Compose 部署 (推荐)

```bash
# 1. 克隆项目
git clone https://github.com/FatRadish/autoFetch.git
cd autoFetch

# 2. 配置环境变量
cp apps/backend/.env.example apps/backend/.env
# 编辑配置文件

# 3. 启动服务
docker-compose -f docker-compose.prod.yml up -d

# 4. 查看日志
docker-compose -f docker-compose.prod.yml logs -f

# 5. 停止服务
docker-compose -f docker-compose.prod.yml down
```

### 手动部署

```bash
# 1. 构建项目
pnpm install
pnpm build

# 2. 数据库迁移
cd apps/backend
pnpm prisma:deploy

# 3. 启动后端服务
pnpm start

# 4. 配置 Nginx 代理前端静态文件
# 参考 nginx/nginx.conf
```

### 环境变量说明

在 `apps/backend/.env` 中配置:

```env
# 数据库
DATABASE_URL="file:./dev.db"

# JWT 密钥
JWT_SECRET="your-secret-key"

# 加密密钥 (用于加密 Cookie)
ENCRYPTION_KEY="your-encryption-key"

# 服务端口
PORT=3000

# CORS 允许的前端地址
CORS_ORIGIN="http://localhost:5173"

# 日志级别
LOG_LEVEL="info"
```

## 🔒 安全建议

1. **修改默认密钥**: 生产环境必须修改 `JWT_SECRET` 和 `ENCRYPTION_KEY`
2. **使用 HTTPS**: 部署时启用 HTTPS 保护数据传输
3. **定期备份**: 定期备份数据库文件
4. **限流配置**: 根据实际情况调整 API 限流参数
5. **Cookie 管理**: 定期检查并更新过期的 Cookie

## 📝 功能路线图

- [x] 基础账号和平台管理
- [x] 任务调度系统
- [x] 执行日志记录
- [x] Docker 部署支持
- [ ] 浏览器插件 (一键导出 Cookie)
- [ ] 通知系统 (邮件、Webhook)
- [ ] 更多平台适配器
- [ ] 数据统计和可视化
- [ ] 移动端适配

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

## 📄 许可证

本项目基于 [MIT](LICENSE) 许可证开源。

## ⚠️ 免责声明

本项目仅供学习交流使用，请遵守各平台的服务条款。使用本项目导致的任何问题由使用者自行承担。

## 🙏 致谢

感谢所有为这个项目做出贡献的开发者！

---

<div align="center">

**[⬆ 回到顶部](#autofetch---自动领取福利系统)**

Made with ❤️ by [FatRadish](https://github.com/FatRadish)

</div>
