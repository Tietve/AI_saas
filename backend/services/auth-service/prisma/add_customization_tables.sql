-- Migration: Add customization tables for workspace and theme customization
-- Created: 2025-11-02

-- Create UserPreferences table
CREATE TABLE IF NOT EXISTS "UserPreferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "themeMode" TEXT NOT NULL DEFAULT 'light',
    "colorScheme" TEXT NOT NULL DEFAULT 'blue',
    "backgroundType" TEXT NOT NULL DEFAULT 'none',
    "backgroundImage" TEXT,
    "backgroundOpacity" INTEGER NOT NULL DEFAULT 20,
    "fontSize" TEXT NOT NULL DEFAULT 'medium',
    "fontFamily" TEXT NOT NULL DEFAULT 'system',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPreferences_pkey" PRIMARY KEY ("id")
);

-- Create Workspace table
CREATE TABLE IF NOT EXISTS "Workspace" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(500),
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "layoutType" TEXT NOT NULL DEFAULT 'default',
    "sidebarPosition" TEXT NOT NULL DEFAULT 'left',
    "sidebarCollapsed" BOOLEAN NOT NULL DEFAULT false,
    "messageDensity" TEXT NOT NULL DEFAULT 'comfortable',
    "showAvatars" BOOLEAN NOT NULL DEFAULT true,
    "showTimestamps" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
);

-- Create WorkspaceTemplate table
CREATE TABLE IF NOT EXISTS "WorkspaceTemplate" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(500),
    "thumbnailUrl" TEXT,
    "settings" JSONB NOT NULL,
    "category" TEXT,
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkspaceTemplate_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint for UserPreferences.userId
CREATE UNIQUE INDEX IF NOT EXISTS "UserPreferences_userId_key" ON "UserPreferences"("userId");

-- Create indexes for UserPreferences
CREATE INDEX IF NOT EXISTS "UserPreferences_userId_idx" ON "UserPreferences"("userId");

-- Create indexes for Workspace
CREATE INDEX IF NOT EXISTS "Workspace_userId_idx" ON "Workspace"("userId");
CREATE INDEX IF NOT EXISTS "Workspace_userId_isDefault_idx" ON "Workspace"("userId", "isDefault");
CREATE INDEX IF NOT EXISTS "Workspace_userId_displayOrder_idx" ON "Workspace"("userId", "displayOrder");

-- Create indexes for WorkspaceTemplate
CREATE INDEX IF NOT EXISTS "WorkspaceTemplate_category_idx" ON "WorkspaceTemplate"("category");
CREATE INDEX IF NOT EXISTS "WorkspaceTemplate_isPremium_idx" ON "WorkspaceTemplate"("isPremium");
CREATE INDEX IF NOT EXISTS "WorkspaceTemplate_displayOrder_idx" ON "WorkspaceTemplate"("displayOrder");

-- Add foreign key constraints
ALTER TABLE "UserPreferences" DROP CONSTRAINT IF EXISTS "UserPreferences_userId_fkey";
ALTER TABLE "UserPreferences" ADD CONSTRAINT "UserPreferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Workspace" DROP CONSTRAINT IF EXISTS "Workspace_userId_fkey";
ALTER TABLE "Workspace" ADD CONSTRAINT "Workspace_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
