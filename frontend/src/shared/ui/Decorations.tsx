/**
 * Theme-specific decorative components
 * Each theme has its own unique visual effects
 */

import type { ThemeName } from '@/shared/config/theme';

interface ThemeDecorationsProps {
  theme: ThemeName;
}

// Snowflakes for Fir Green theme
function SnowflakesEffect() {
  return (
    <>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="snowflake" style={{
          left: `${10 + i * 15}%`,
          animationDelay: `${i * 0.5}s`,
          animationDuration: `${6 + i}s`,
        }}>
          ❄️
        </div>
      ))}
    </>
  );
}

// Bubbles for Ocean theme
function BubblesEffect() {
  return (
    <>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="bubble" style={{
          left: `${10 + i * 15}%`,
          animationDelay: `${i * 0.5}s`,
          animationDuration: `${6 + i}s`,
        }}>
          🫧
        </div>
      ))}
    </>
  );
}

// Stars for Purple theme
function StarsEffect() {
  return (
    <>
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <div key={i} className="star" style={{
          left: `${5 + i * 12}%`,
          animationDelay: `${i * 0.3}s`,
          animationDuration: `${3 + i * 0.5}s`,
        }}>
          ✨
        </div>
      ))}
    </>
  );
}

// Autumn leaves for Orange theme
function LeavesEffect() {
  const leaves = ['🍂', '🍁'];
  return (
    <>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="leaf" style={{
          left: `${8 + i * 16}%`,
          animationDelay: `${i * 0.8}s`,
          animationDuration: `${7 + i}s`,
        }}>
          {leaves[i % 2]}
        </div>
      ))}
    </>
  );
}

// Flower petals for Rose theme
function PetalsEffect() {
  return (
    <>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="petal" style={{
          left: `${12 + i * 14}%`,
          animationDelay: `${i * 0.6}s`,
          animationDuration: `${8 + i * 0.5}s`,
        }}>
          🌸
        </div>
      ))}
    </>
  );
}

// Butterflies for Lavender theme
function ButterfliesEffect() {
  return (
    <>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="butterfly" style={{
          left: `${15 + i * 20}%`,
          animationDelay: `${i * 1.2}s`,
          animationDuration: `${10 + i * 2}s`,
        }}>
          🦋
        </div>
      ))}
    </>
  );
}

// Mint leaves for Mint theme
function MintLeavesEffect() {
  return (
    <>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="mint-leaf" style={{
          left: `${10 + i * 15}%`,
          animationDelay: `${i * 0.7}s`,
          animationDuration: `${6 + i}s`,
        }}>
          🍃
        </div>
      ))}
    </>
  );
}

// Hearts for Coral theme
function HeartsEffect() {
  return (
    <>
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="heart" style={{
          left: `${15 + i * 16}%`,
          animationDelay: `${i * 0.9}s`,
          animationDuration: `${7 + i * 0.8}s`,
        }}>
          ❤️
        </div>
      ))}
    </>
  );
}

// Main theme decorations component
export function ThemeDecorations({ theme }: ThemeDecorationsProps) {
  // White and Black themes have NO effects
  if (theme === 'white' || theme === 'black') {
    return null;
  }

  // Render theme-specific effects
  switch (theme) {
    case 'default':
      return <SnowflakesEffect />;
    case 'ocean':
      return <BubblesEffect />;
    case 'purple':
      return <StarsEffect />;
    case 'orange':
      return <LeavesEffect />;
    case 'rose':
      return <PetalsEffect />;
    case 'lavender':
      return <ButterfliesEffect />;
    case 'mint':
      return <MintLeavesEffect />;
    case 'coral':
      return <HeartsEffect />;
    default:
      return null;
  }
}

// Legacy exports for backward compatibility
export function Snowflakes() {
  return <SnowflakesEffect />;
}

export function PineTreeDecoration() {
  return (
    <div className="pine-tree-decoration">
      <svg viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M50 10 L70 35 L30 35 Z" fill="#d1fae5" opacity="0.4" />
        <path d="M50 30 L75 60 L25 60 Z" fill="#a7f3d0" opacity="0.4" />
        <path d="M50 50 L80 90 L20 90 Z" fill="#10b981" opacity="0.3" />
        <rect x="45" y="90" width="10" height="30" fill="#065f46" opacity="0.3" />
      </svg>
    </div>
  );
}
