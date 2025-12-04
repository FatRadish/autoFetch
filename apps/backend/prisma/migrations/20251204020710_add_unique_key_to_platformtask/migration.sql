/*
  Warnings:

  - A unique constraint covering the columns `[key]` on the table `PlatformTask` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "PlatformTask_key_key" ON "PlatformTask"("key");
