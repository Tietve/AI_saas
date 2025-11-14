import { useTheme } from '@/shared/hooks/useTheme';

export function DarkModeToggle() {
  const { darkMode, toggleDarkMode } = useTheme();

  return (
    <div
      className="theme-toggle-container"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 12px',
        background: 'transparent',
        borderRadius: '6px',
        margin: '0 8px 6px',
        cursor: 'pointer',
        transition: 'background 0.15s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
      }}
      onClick={toggleDarkMode}
    >
      <span
        style={{
          fontSize: '13px',
          color: 'rgba(255, 255, 255, 0.85)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontWeight: 500,
        }}
      >
        <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
        Dark mode
      </span>

      <div
        className={`theme-toggle ${darkMode ? 'active' : ''}`}
        style={{
          position: 'relative',
          width: '40px',
          height: '20px',
          background: darkMode ? 'var(--primary-500)' : 'rgba(255, 255, 255, 0.25)',
          borderRadius: '10px',
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
      >
        <div
          className="theme-toggle-slider"
          style={{
            position: 'absolute',
            top: '2px',
            left: darkMode ? '22px' : '2px',
            width: '16px',
            height: '16px',
            background: 'white',
            borderRadius: '50%',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '8px',
          }}
        >
          {darkMode ? '☀️' : '🌙'}
        </div>
      </div>
    </div>
  );
}
