-- RenameEnum
ALTER TYPE "serviceStatus" RENAME TO "ServiceStatus";

-- RenameTable
ALTER TABLE "project" RENAME TO "Project";
ALTER TABLE "service" RENAME TO "Service";
ALTER TABLE "domain" RENAME TO "Domain";

-- RenameConstraints
ALTER TABLE "Project" RENAME CONSTRAINT "project_pkey" TO "Project_pkey";
ALTER TABLE "Project" RENAME CONSTRAINT "project_ownerId_fkey" TO "Project_ownerId_fkey";
ALTER TABLE "Service" RENAME CONSTRAINT "service_pkey" TO "Service_pkey";
ALTER TABLE "Service" RENAME CONSTRAINT "service_projectId_fkey" TO "Service_projectId_fkey";
ALTER TABLE "Domain" RENAME CONSTRAINT "domain_pkey" TO "Domain_pkey";
ALTER TABLE "Domain" RENAME CONSTRAINT "domain_serviceId_fkey" TO "Domain_serviceId_fkey";

-- RenameIndexes
ALTER INDEX "project_slug_key" RENAME TO "Project_slug_key";
ALTER INDEX "service_slug_key" RENAME TO "Service_slug_key";
ALTER INDEX "domain_host_key" RENAME TO "Domain_host_key";
ALTER INDEX "service_projectId_idx" RENAME TO "Service_projectId_idx";
ALTER INDEX "domain_serviceId_idx" RENAME TO "Domain_serviceId_idx";

-- CreateIndex
CREATE INDEX "Project_ownerId_idx" ON "Project"("ownerId");
CREATE INDEX "Log_serviceId_timestamp_idx" ON "Log"("serviceId", "timestamp");
CREATE INDEX "Log_deploymentId_timestamp_idx" ON "Log"("deploymentId", "timestamp");
CREATE UNIQUE INDEX "EnvironmentVariable_serviceId_key_key" ON "EnvironmentVariable"("serviceId", "key");

-- SwapDeploymentIndex
DROP INDEX "Deployment_serviceId_idx";
CREATE INDEX "Deployment_serviceId_createdAt_idx" ON "Deployment"("serviceId", "createdAt");
