import { useTheme, themeColors, type ThemeName } from '@/shared/hooks/useTheme';

const quickThemes: { name: ThemeName; title: string }[] = [
  { name: 'default', title: 'Fir Green' },
  { name: 'ocean', title: 'Ocean Blue' },
  { name: 'purple', title: 'Purple Dream' },
  { name: 'orange', title: 'Sunset Orange' },
  { name: 'rose', title: 'Rose Pink' },
  { name: 'mint', title: 'Mint Fresh' },
  { name: 'white', title: 'Pure White' },
  { name: 'black', title: 'Pure Black' },
];

export function QuickThemeSelector() {
  const { theme: activeTheme, setTheme } = useTheme();

  return (
    <div
      className="quick-themes"
      style={{
        display: 'flex',
        gap: '8px',
        padding: '12px',
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '8px',
        justifyContent: 'center',
        flexWrap: 'wrap',
      }}
    >
      {quickThemes.map((theme) => {
        const colors = themeColors[theme.name];
        const isActive = activeTheme === theme.name;

        return (
          <div
            key={theme.name}
            className={`quick-theme ${isActive ? 'active' : ''}`}
            data-theme={theme.name}
            onClick={() => setTheme(theme.name)}
            title={theme.title}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              border: isActive ? '2px solid white' : '2px solid transparent',
              background: `linear-gradient(135deg, ${colors.primary}, ${colors.tertiary})`,
              position: 'relative',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.1)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = 'none';
              }
            }}
          >
            {isActive && (
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  textShadow: '0 1px 3px rgba(0, 0, 0, 0.5)',
                }}
              >
                ✓
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
