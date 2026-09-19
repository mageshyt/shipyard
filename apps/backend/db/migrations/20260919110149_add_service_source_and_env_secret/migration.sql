-- CreateEnum
CREATE TYPE "ServiceSource" AS ENUM ('GIT', 'UPLOAD', 'IMAGE');

-- AlterTable
ALTER TABLE "Deployment" ADD COLUMN     "parent_id" TEXT;

-- AlterTable
ALTER TABLE "EnvironmentVariable" ADD COLUMN     "is_secret" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "archive_key" TEXT,
ADD COLUMN     "branch" TEXT,
ADD COLUMN     "image_ref" TEXT,
ADD COLUMN     "repository_url" TEXT,
ADD COLUMN     "source" "ServiceSource" NOT NULL DEFAULT 'GIT';

-- AddForeignKey
ALTER TABLE "Deployment" ADD CONSTRAINT "Deployment_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "Deployment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
