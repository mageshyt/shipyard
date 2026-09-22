-- AlterTable
ALTER TABLE "Domain" ADD COLUMN     "containerPort" INTEGER,
ADD COLUMN     "internal_path" TEXT,
ADD COLUMN     "path" TEXT DEFAULT '/';
