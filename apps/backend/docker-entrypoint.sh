#!/bin/sh
set -e

echo "🚀 Starting AutoFetch Backend..."

# 确保数据目录存在
mkdir -p /app/data

echo "📦 Running database migrations..."
# 运行数据库迁移
cd /app/apps/backend
npx prisma migrate deploy || {
    echo "⚠️  Migration failed, but continuing startup..."
}

echo "✅ Database migrations completed"

# 运行数据库 seed（仅在数据库为空时）
# echo "🌱 Checking if database needs seeding..."
# npx prisma db seed || {
#     echo "⚠️  Seed failed or already seeded, continuing..."
# }

# # 首次启动时执行 seed（如果数据库为空）
# if [ ! -f /app/data/.seeded ]; then
#     echo "🌱 Running database seed..."
#     npx prisma db seed && touch /app/data/.seeded || {
#         echo "⚠️  Seed failed or not configured"
#     }
# fi

echo "🎯 Starting application..."
# 启动应用
exec node dist/src/app.js
