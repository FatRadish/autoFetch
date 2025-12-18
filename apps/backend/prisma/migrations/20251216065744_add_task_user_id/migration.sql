/*
  Warnings:

  - Added the required column `userId` to the `Task` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "schedule" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "retryTimes" INTEGER NOT NULL DEFAULT 3,
    "timeout" INTEGER NOT NULL DEFAULT 30000,
    "lastRunAt" DATETIME,
    "nextRunAt" DATETIME,
    "config" TEXT DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "platformTaskId" TEXT,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Task_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Task_platformTaskId_fkey" FOREIGN KEY ("platformTaskId") REFERENCES "PlatformTask" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Task_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
-- 回填 userId：通过 Task.accountId -> Account.userId 关联填充
INSERT INTO "new_Task" (
  "id", "accountId", "name", "schedule", "enabled", "retryTimes", "timeout",
  "lastRunAt", "nextRunAt", "config", "createdAt", "updatedAt", "platformTaskId", "userId"
) 
SELECT 
  t."id",
  t."accountId",
  t."name",
  t."schedule",
  t."enabled",
  t."retryTimes",
  t."timeout",
  t."lastRunAt",
  t."nextRunAt",
  t."config",
  t."createdAt",
  t."updatedAt",
  t."platformTaskId",
  (SELECT a."userId" FROM "Account" a WHERE a."id" = t."accountId") AS "userId"
FROM "Task" t;
DROP TABLE "Task";
ALTER TABLE "new_Task" RENAME TO "Task";
CREATE UNIQUE INDEX "Task_name_key" ON "Task"("name");
CREATE INDEX "Task_accountId_idx" ON "Task"("accountId");
CREATE INDEX "Task_enabled_idx" ON "Task"("enabled");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
