-- Service slugs are unique per project, not globally.
-- Two projects may both own a service called "api".
DROP INDEX "Service_slug_key";

CREATE UNIQUE INDEX "Service_projectId_slug_key" ON "Service"("projectId", "slug");
