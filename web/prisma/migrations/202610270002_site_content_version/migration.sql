-- CreateTable
CREATE TABLE "SiteContentVersion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT
);

-- CreateIndex
CREATE INDEX "SiteContentVersion_key_createdAt_idx" ON "SiteContentVersion"("key", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SiteContentVersion_key_version_key" ON "SiteContentVersion"("key", "version");
