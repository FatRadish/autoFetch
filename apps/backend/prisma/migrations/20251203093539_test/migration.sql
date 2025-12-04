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
    CONSTRAINT "Task_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Task_platformTaskId_fkey" FOREIGN KEY ("platformTaskId") REFERENCES "PlatformTask" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Task" ("accountId", "config", "createdAt", "enabled", "id", "lastRunAt", "name", "nextRunAt", "retryTimes", "schedule", "timeout", "updatedAt") SELECT "accountId", "config", "createdAt", "enabled", "id", "lastRunAt", "name", "nextRunAt", "retryTimes", "schedule", "timeout", "updatedAt" FROM "Task";
DROP TABLE "Task";
ALTER TABLE "new_Task" RENAME TO "Task";
CREATE INDEX "Task_accountId_idx" ON "Task"("accountId");
CREATE INDEX "Task_enabled_idx" ON "Task"("enabled");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
