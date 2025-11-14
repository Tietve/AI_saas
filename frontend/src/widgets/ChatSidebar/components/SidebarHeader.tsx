interface SidebarHeaderProps {
  onNewConversation: () => void;
}

export function SidebarHeader({ onNewConversation }: SidebarHeaderProps) {
  return (
    <div style={{ padding: '24px 20px' }}>
      {/* Logo and Title */}
      <div
        className="sidebar-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '14px 18px',
          marginBottom: '24px',
          background: 'transparent',
          borderRadius: '12px',
          border: 'none',
        }}
      >
        {/* Fir Box Logo */}
        <div
          className="sidebar-logo"
          style={{
            width: '36px',
            height: '36px',
            background: 'linear-gradient(135deg, #e8e4dc 0%, #d4cfc0 100%)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
          }}
        >
          <svg width="22" height="22" viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M50 15 L70 40 L30 40 Z" fill="none" stroke="#1e5a37" strokeWidth="7" strokeLinejoin="miter" />
            <path d="M50 35 L70 60 L30 60 Z" fill="none" stroke="#1e5a37" strokeWidth="7" strokeLinejoin="miter" />
            <path d="M50 55 L70 80 L30 80 Z" fill="none" stroke="#1e5a37" strokeWidth="7" strokeLinejoin="miter" />
            <rect x="45" y="80" width="10" height="20" fill="#1e5a37" />
          </svg>
        </div>

        {/* Title */}
        <span
          className="sidebar-title"
          style={{
            fontSize: '15px',
            fontWeight: 600,
            color: 'white',
          }}
        >
          Fir Box AI
        </span>
      </div>

      {/* NEW CHAT BUTTON */}
      <button
        className="new-chat-btn"
        onClick={onNewConversation}
        style={{
          width: '100%',
          padding: '14px 18px',
          background: 'linear-gradient(135deg, var(--primary-500) 0%, var(--primary-600) 100%)',
          color: 'white',
          border: 'none',
          borderRadius: '12px',
          fontSize: '14px',
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          transition: 'all 0.2s',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.25)';
          e.currentTarget.style.background = 'linear-gradient(135deg, var(--primary-600) 0%, var(--primary-700) 100%)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
          e.currentTarget.style.background = 'linear-gradient(135deg, var(--primary-500) 0%, var(--primary-600) 100%)';
        }}
      >
        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
        </svg>
        Cuộc trò chuyện mới
      </button>
    </div>
  );
}
