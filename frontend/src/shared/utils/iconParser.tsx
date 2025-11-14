import * as LucideIcons from 'lucide-react';

// Type for Lucide icon components
type IconComponent = typeof LucideIcons.Check;

/**
 * Icon mapping - Common icons for chat messages
 * Supports :icon_name: syntax (like Discord/Slack)
 */
export const ICON_MAP: Record<string, IconComponent> = {
  // Status & Feedback
  check: LucideIcons.Check,
  checkmark: LucideIcons.Check,
  tick: LucideIcons.Check,
  x: LucideIcons.X,
  cross: LucideIcons.X,
  alert: LucideIcons.AlertCircle,
  warning: LucideIcons.AlertTriangle,
  info: LucideIcons.Info,
  help: LucideIcons.HelpCircle,
  question: LucideIcons.HelpCircle,

  // Emotions & Reactions
  fire: LucideIcons.Flame,
  rocket: LucideIcons.Rocket,
  star: LucideIcons.Star,
  heart: LucideIcons.Heart,
  thumbsup: LucideIcons.ThumbsUp,
  thumbsdown: LucideIcons.ThumbsDown,
  smile: LucideIcons.Smile,
  party: LucideIcons.PartyPopper,
  sparkles: LucideIcons.Sparkles,
  zap: LucideIcons.Zap,

  // Navigation & Actions
  arrow: LucideIcons.ArrowRight,
  arrowleft: LucideIcons.ArrowLeft,
  arrowright: LucideIcons.ArrowRight,
  arrowup: LucideIcons.ArrowUp,
  arrowdown: LucideIcons.ArrowDown,
  link: LucideIcons.Link,
  download: LucideIcons.Download,
  upload: LucideIcons.Upload,
  search: LucideIcons.Search,
  settings: LucideIcons.Settings,

  // Files & Documents
  file: LucideIcons.File,
  folder: LucideIcons.Folder,
  code: LucideIcons.Code,
  terminal: LucideIcons.Terminal,
  database: LucideIcons.Database,
  image: LucideIcons.Image,
  video: LucideIcons.Video,
  music: LucideIcons.Music,

  // Communication
  mail: LucideIcons.Mail,
  message: LucideIcons.MessageSquare,
  phone: LucideIcons.Phone,
  bell: LucideIcons.Bell,

  // Time & Calendar
  clock: LucideIcons.Clock,
  calendar: LucideIcons.Calendar,

  // User & Team
  user: LucideIcons.User,
  users: LucideIcons.Users,
  team: LucideIcons.Users,

  // Tools & Tech
  github: LucideIcons.Github,
  lock: LucideIcons.Lock,
  unlock: LucideIcons.Unlock,
  key: LucideIcons.Key,
  shield: LucideIcons.Shield,
  cpu: LucideIcons.Cpu,
  server: LucideIcons.Server,
  cloud: LucideIcons.Cloud,

  // Misc
  eye: LucideIcons.Eye,
  eyeoff: LucideIcons.EyeOff,
  sun: LucideIcons.Sun,
  moon: LucideIcons.Moon,
  globe: LucideIcons.Globe,
  bookmark: LucideIcons.Bookmark,
  tag: LucideIcons.Tag,
  gift: LucideIcons.Gift,
  trophy: LucideIcons.Trophy,
  flag: LucideIcons.Flag,
  target: LucideIcons.Target,

  // Arrows & Directions
  chevronup: LucideIcons.ChevronUp,
  chevrondown: LucideIcons.ChevronDown,
  chevronleft: LucideIcons.ChevronLeft,
  chevronright: LucideIcons.ChevronRight,

  // Edit & Create
  edit: LucideIcons.Edit,
  trash: LucideIcons.Trash2,
  copy: LucideIcons.Copy,
  plus: LucideIcons.Plus,
  minus: LucideIcons.Minus,

  // Loading & Progress
  loader: LucideIcons.Loader,
  refresh: LucideIcons.RefreshCw,

  // Layout
  layout: LucideIcons.Layout,
  menu: LucideIcons.Menu,
  grid: LucideIcons.Grid,
  list: LucideIcons.List,
};

/**
 * Parse text and replace :icon_name: with icon components
 * Returns array of text segments and icon elements
 */
export function parseIconsInText(text: string): Array<string | { type: 'icon'; name: string; Icon: IconComponent }> {
  const iconRegex = /:([a-zA-Z0-9_]+):/g;
  const parts: Array<string | { type: 'icon'; name: string; Icon: IconComponent }> = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = iconRegex.exec(text)) !== null) {
    const iconName = match[1].toLowerCase();
    const Icon = ICON_MAP[iconName];

    // Add text before icon
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    // Add icon if found, otherwise keep original text
    if (Icon) {
      parts.push({ type: 'icon', name: iconName, Icon });
    } else {
      parts.push(match[0]); // Keep :unknown_icon: as text
    }

    lastIndex = iconRegex.lastIndex;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts;
}

/**
 * Check if text contains any icon syntax
 */
export function hasIcons(text: string): boolean {
  return /:([a-zA-Z0-9_]+):/.test(text);
}

/**
 * Get list of all available icon names
 */
export function getAvailableIcons(): string[] {
  return Object.keys(ICON_MAP).sort();
}

/**
 * Get icon component by name
 */
export function getIcon(name: string): IconComponent | undefined {
  return ICON_MAP[name.toLowerCase()];
}

// Export IconComponent type for external use
export type { IconComponent };
