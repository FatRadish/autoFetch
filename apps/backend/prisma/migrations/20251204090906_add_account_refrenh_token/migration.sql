-- AlterTable
ALTER TABLE "Account" ADD COLUMN "lastRefreshTime" DATETIME;
ALTER TABLE "Account" ADD COLUMN "refreshToken" TEXT;
