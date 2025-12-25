# Docker 部署指南

本文档介绍如何使用 Docker 部署 AutoFetch 项目。

## 📋 前置要求

- Docker 20.10+
- Docker Compose 2.0+

## ⚡ 快速开始（一键部署）

```bash
# 1. 配置环境变量
cp .env.example .env
nano .env  # 修改 JWT_SECRET、CORS_ORIGIN 等

# 2. 启动服务（数据库会自动初始化）
docker-compose up -d

# 3. 查看启动日志（可选）
docker-compose logs -f backend

# 4. 访问应用
# 前端: http://localhost:8083 （或 http://localhost:${WEB_PORT}）
# 后端: http://localhost:3000
```

## 🚀 详细部署步骤

### 1. 克隆项目

```bash
git clone <your-repo-url>
cd autoFetch
```

### 2. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑环境变量文件，修改必要的配置
nano .env
```

**重要配置项：**

- `JWT_SECRET`: 设置强密码
- `CORS_ORIGIN`: 设置前端域名（多个域名用逗号分隔）
- `VITE_API_URL`: 设置后端 API 地址
- `WEB_PORT`: 前端对外暴露端口（默认 8083）

### 3. 启动服务

**注意：** 数据库迁移会在后端容器启动时自动执行，无需手动操作。

#### 开发环境

```bash
# 构建并启动所有服务
docker-compose up -d

# 查看日志（建议查看后端日志确认数据库初始化成功）
docker-compose logs -f backend

# 停止服务
docker-compose down
```

#### 生产环境（使用 Nginx 反向代理）

```bash
# 使用生产配置
docker-compose -f docker-compose.prod.yml up -d

# 查看日志
docker-compose -f docker-compose.prod.yml logs -f

# 停止服务
docker-compose -f docker-compose.prod.yml down
```

**注意：** 数据库迁移会在后端容器启动时自动执行，无需手动操作。

### 4. 访问应用

- 前端：http://localhost:8083 （如果修改了 `WEB_PORT`，则为 `http://localhost:${WEB_PORT}`）
- 后端 API：http://localhost:3000
- 后端健康检查：http://localhost:3000/health

### 5. 端口配置说明

默认端口配置：

- 前端：8083（可通过 `.env` 中的 `WEB_PORT` 修改）
- 前端 HTTPS：443（可通过 `.env` 中的 `WEB_SSL_PORT` 修改，仅生产环境）
- 后端：3000（固定）

如需修改前端端口，在 `.env` 文件中设置：

```env
WEB_PORT=8080  # 例如改为 8080
```

然后重启服务：

```bash
docker-compose down
docker-compose up -d
```

## 🔧 常用命令

### 查看服务状态

```bash
docker-compose ps
```

### 查看日志

```bash
# 查看所有服务日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f backend
docker-compose logs -f web
```

### 重启服务

```bash
# 重启所有服务
docker-compose restart

# 重启特定服务
docker-compose restart backend
```

### 重新构建镜像

```bash
# 重新构建并启动
docker-compose up -d --build

# 仅重新构建特定服务
docker-compose build backend
docker-compose up -d backend
```

### 进入容器

```bash
# 进入后端容器
docker exec -it autofetch-backend sh

# 进入前端容器
docker exec -it autofetch-web sh
```

### 清理

```bash
# 停止并删除容器、网络
docker-compose down

# 同时删除卷（会删除数据库数据！）
docker-compose down -v

# 删除镜像
docker-compose down --rmi all
```

## 📦 数据持久化

项目使用 Docker volumes 持久化以下数据：

- `backend-data`: 数据库文件 (SQLite)
- `backend-logs`: 应用日志

备份数据：

```bash
# 备份数据库
docker cp autofetch-backend:/app/data/app.db ./backup/app.db

# 或者直接备份 volume
docker run --rm -v autofetch_backend-data:/data -v $(pwd)/backup:/backup alpine tar czf /backup/backend-data.tar.gz -C /data .
```

恢复数据：

```bash
# 恢复数据库
docker cp ./backup/app.db autofetch-backend:/app/data/app.db

# 或者恢复 volume
docker run --rm -v autofetch_backend-data:/data -v $(pwd)/backup:/backup alpine tar xzf /backup/backend-data.tar.gz -C /data
```

## 🔐 生产环境注意事项

### 1. 环境变量安全

- ✅ 修改 `JWT_SECRET` 为强密码
- ✅ 使用 HTTPS（配置 SSL 证书）
- ✅ 限制 CORS 来源
- ✅ 不要将 `.env` 文件提交到代码仓库

### 2. Nginx 配置（生产环境）

如果使用 `docker-compose.prod.yml`，需要创建 Nginx 配置：

```bash
mkdir -p nginx/conf.d nginx/ssl
```

创建 `nginx/conf.d/default.conf`：

```nginx
upstream backend {
    server backend:3000;
}

upstream web {
    server web:80;
}

server {
    listen 80;
    server_name your-domain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL 证书
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    # API 代理
    location /api {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 前端静态文件
    location / {
        proxy_pass http://web;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 3. 资源限制

在 `docker-compose.yml` 中添加资源限制：

```yaml
services:
  backend:
    # ... other config
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

### 4. 监控和日志

- 配置日志轮转
- 使用 Docker 日志驱动
- 考虑使用监控工具（如 Prometheus + Grafana）

## 🐛 故障排查

### 容器无法启动

```bash
# 查看容器日志
docker-compose logs backend
docker-compose logs web

# 检查容器状态
docker-compose ps
```

### 数据库连接问题

确保数据库路径正确，并且 volume 已创建：

```bash
docker volume ls | grep backend-data
```

### 端口冲突

如果端口被占用，修改 `docker-compose.yml` 中的端口映射：

```yaml
ports:
  - "8080:80"  # 将 80 改为其他端口
```

### 网络问题

检查 Docker 网络：

```bash
docker network ls
docker network inspect autofetch_autofetch-network
```

## 📚 更多资源

- [Docker 官方文档](https://docs.docker.com/)
- [Docker Compose 文档](https://docs.docker.com/compose/)
- [Prisma 部署指南](https://www.prisma.io/docs/guides/deployment)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！
