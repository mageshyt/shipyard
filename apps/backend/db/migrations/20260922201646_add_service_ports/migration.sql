-- Declared port mappings live on the service; the deploy step passes
-- them straight into container creation. NULL = no published ports.
ALTER TABLE "Service" ADD COLUMN "ports" JSONB;
