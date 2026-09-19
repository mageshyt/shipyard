/*
  Warnings:

  - The `status` column on the `Deployment` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "DeploymentSource" AS ENUM ('MANUAL', 'GIT', 'RETRY');

-- CreateEnum
CREATE TYPE "DeploymentStatus" AS ENUM ('QUEUED', 'PREPARING', 'BUILDING', 'DEPLOYING', 'RUNNING', 'FAILED', 'CANCELLED');

-- AlterTable
ALTER TABLE "Deployment" ADD COLUMN     "attempt" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "error" TEXT,
ADD COLUMN     "job_id" TEXT,
ADD COLUMN     "source" "DeploymentSource" NOT NULL DEFAULT 'MANUAL',
ADD COLUMN     "started_at" TIMESTAMP(3),
DROP COLUMN "status",
ADD COLUMN     "status" "DeploymentStatus" NOT NULL DEFAULT 'QUEUED';

-- CreateIndex
CREATE INDEX "Deployment_status_idx" ON "Deployment"("status");

-- Backstop lock: at most one non-terminal deployment per service.
-- Prisma cannot express partial unique indexes, so this lives as raw SQL.
CREATE UNIQUE INDEX "one_active_deployment_per_service"
  ON "Deployment" ("serviceId")
  WHERE status IN ('QUEUED', 'PREPARING', 'BUILDING', 'DEPLOYING');
