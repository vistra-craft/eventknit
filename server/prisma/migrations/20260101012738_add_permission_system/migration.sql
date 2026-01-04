-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "isSystem" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamRolePermission" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamRolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Permission_key_key" ON "Permission"("key");

-- CreateIndex
CREATE INDEX "Permission_category_idx" ON "Permission"("category");

-- CreateIndex
CREATE INDEX "Permission_key_idx" ON "Permission"("key");

-- CreateIndex
CREATE UNIQUE INDEX "TeamRolePermission_roleId_permissionId_key" ON "TeamRolePermission"("roleId", "permissionId");

-- CreateIndex
CREATE INDEX "TeamRolePermission_roleId_idx" ON "TeamRolePermission"("roleId");

-- CreateIndex
CREATE INDEX "TeamRolePermission_permissionId_idx" ON "TeamRolePermission"("permissionId");

-- CreateIndex
CREATE INDEX "TeamRoleTemplate_isActive_idx" ON "TeamRoleTemplate"("isActive");

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "customRoleId" TEXT;

-- AddForeignKey
ALTER TABLE "TeamRolePermission" ADD CONSTRAINT "TeamRolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "TeamRoleTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamRolePermission" ADD CONSTRAINT "TeamRolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_customRoleId_fkey" FOREIGN KEY ("customRoleId") REFERENCES "TeamRoleTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
