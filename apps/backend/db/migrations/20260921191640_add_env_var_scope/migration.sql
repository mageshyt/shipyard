-- Each variable declares where it flows: container runtime, image
-- build args, or both. Existing rows default to RUNTIME (current behavior).
CREATE TYPE "EnvVarScope" AS ENUM ('RUNTIME', 'BUILD', 'BOTH');

ALTER TABLE "EnvironmentVariable" ADD COLUMN "scope" "EnvVarScope" NOT NULL DEFAULT 'RUNTIME';
