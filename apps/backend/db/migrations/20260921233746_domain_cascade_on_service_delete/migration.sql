-- Domains are service-owned config with no independent life: when the
-- service goes, its domains go with it. (Deployments stay restrict —
-- history is protected, config is not.)
ALTER TABLE "Domain" DROP CONSTRAINT "Domain_serviceId_fkey";
ALTER TABLE "Domain" ADD CONSTRAINT "Domain_serviceId_fkey"
  FOREIGN KEY ("serviceId") REFERENCES "Service"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
