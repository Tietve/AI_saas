-- Seed data for WorkspaceTemplate
-- Default workspace templates for users to choose from

-- Clear existing templates (optional, for idempotency)
-- DELETE FROM "WorkspaceTemplate";

-- Template 1: Default Light
INSERT INTO "WorkspaceTemplate" ("id", "name", "description", "thumbnailUrl", "settings", "category", "isPremium", "displayOrder", "createdAt", "updatedAt")
VALUES (
    'tpl_default_light',
    'Default Light',
    'Clean and simple light workspace with comfortable spacing',
    NULL,
    '{"themeMode": "light", "colorScheme": "blue", "backgroundType": "none", "layoutType": "default", "sidebarPosition": "left", "messageDensity": "comfortable", "showAvatars": true, "showTimestamps": true}',
    'default',
    false,
    1,
    NOW(),
    NOW()
) ON CONFLICT ("id") DO NOTHING;

-- Template 2: Minimal Dark
INSERT INTO "WorkspaceTemplate" ("id", "name", "description", "thumbnailUrl", "settings", "category", "isPremium", "displayOrder", "createdAt", "updatedAt")
VALUES (
    'tpl_minimal_dark',
    'Minimal Dark',
    'Distraction-free dark mode with compact layout',
    NULL,
    '{"themeMode": "dark", "colorScheme": "gray", "backgroundType": "none", "layoutType": "compact", "sidebarPosition": "left", "messageDensity": "compact", "showAvatars": false, "showTimestamps": false}',
    'minimal',
    false,
    2,
    NOW(),
    NOW()
) ON CONFLICT ("id") DO NOTHING;

-- Template 3: Vibrant Purple
INSERT INTO "WorkspaceTemplate" ("id", "name", "description", "thumbnailUrl", "settings", "category", "isPremium", "displayOrder", "createdAt", "updatedAt")
VALUES (
    'tpl_vibrant_purple',
    'Vibrant Purple',
    'Colorful and energetic purple theme with gradient background',
    NULL,
    '{"themeMode": "dark", "colorScheme": "purple", "backgroundType": "gradient", "backgroundImage": "gradient-purple", "backgroundOpacity": 30, "layoutType": "default", "sidebarPosition": "left", "messageDensity": "comfortable", "showAvatars": true, "showTimestamps": true}',
    'creative',
    true,
    3,
    NOW(),
    NOW()
) ON CONFLICT ("id") DO NOTHING;

-- Template 4: Focus Mode
INSERT INTO "WorkspaceTemplate" ("id", "name", "description", "thumbnailUrl", "settings", "category", "isPremium", "displayOrder", "createdAt", "updatedAt")
VALUES (
    'tpl_focus_mode',
    'Focus Mode',
    'Zen-like workspace with maximum focus and minimal distractions',
    NULL,
    '{"themeMode": "light", "colorScheme": "green", "backgroundType": "image", "backgroundImage": "nature-1", "backgroundOpacity": 15, "layoutType": "wide", "sidebarPosition": "left", "sidebarCollapsed": true, "messageDensity": "spacious", "showAvatars": false, "showTimestamps": false}',
    'productivity',
    false,
    4,
    NOW(),
    NOW()
) ON CONFLICT ("id") DO NOTHING;

-- Template 5: Ocean Blue
INSERT INTO "WorkspaceTemplate" ("id", "name", "description", "thumbnailUrl", "settings", "category", "isPremium", "displayOrder", "createdAt", "updatedAt")
VALUES (
    'tpl_ocean_blue',
    'Ocean Blue',
    'Calm ocean-themed workspace with blue tones',
    NULL,
    '{"themeMode": "dark", "colorScheme": "blue", "backgroundType": "image", "backgroundImage": "abstract-ocean", "backgroundOpacity": 25, "layoutType": "default", "sidebarPosition": "left", "messageDensity": "comfortable", "showAvatars": true, "showTimestamps": true}',
    'creative',
    true,
    5,
    NOW(),
    NOW()
) ON CONFLICT ("id") DO NOTHING;

-- Template 6: Warm Sunset
INSERT INTO "WorkspaceTemplate" ("id", "name", "description", "thumbnailUrl", "settings", "category", "isPremium", "displayOrder", "createdAt", "updatedAt")
VALUES (
    'tpl_warm_sunset',
    'Warm Sunset',
    'Cozy workspace with warm orange and pink tones',
    NULL,
    '{"themeMode": "light", "colorScheme": "orange", "backgroundType": "gradient", "backgroundImage": "gradient-sunset", "backgroundOpacity": 20, "layoutType": "default", "sidebarPosition": "right", "messageDensity": "comfortable", "showAvatars": true, "showTimestamps": true}',
    'creative',
    true,
    6,
    NOW(),
    NOW()
) ON CONFLICT ("id") DO NOTHING;

-- Template 7: Professional Dark
INSERT INTO "WorkspaceTemplate" ("id", "name", "description", "thumbnailUrl", "settings", "category", "isPremium", "displayOrder", "createdAt", "updatedAt")
VALUES (
    'tpl_professional_dark',
    'Professional Dark',
    'Sleek dark workspace for productivity',
    NULL,
    '{"themeMode": "dark", "colorScheme": "blue", "backgroundType": "none", "layoutType": "wide", "sidebarPosition": "left", "messageDensity": "compact", "showAvatars": true, "showTimestamps": true}',
    'productivity',
    false,
    7,
    NOW(),
    NOW()
) ON CONFLICT ("id") DO NOTHING;

-- Template 8: Minimalist White
INSERT INTO "WorkspaceTemplate" ("id", "name", "description", "thumbnailUrl", "settings", "category", "isPremium", "displayOrder", "createdAt", "updatedAt")
VALUES (
    'tpl_minimalist_white',
    'Minimalist White',
    'Ultra-clean white workspace with minimal UI',
    NULL,
    '{"themeMode": "light", "colorScheme": "gray", "backgroundType": "none", "layoutType": "compact", "sidebarPosition": "left", "messageDensity": "spacious", "showAvatars": false, "showTimestamps": false}',
    'minimal',
    false,
    8,
    NOW(),
    NOW()
) ON CONFLICT ("id") DO NOTHING;
