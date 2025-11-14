interface UserProfileCardProps {
  userName?: string;
  userEmail?: string;
  planTier: 'free' | 'plus' | 'pro';
  onUpgrade?: () => void;
}

export function UserProfileCard({
  userName = 'Demo User',
  userEmail = 'user@example.com',
}: UserProfileCardProps) {
  return (
    <button
      className="user-profile"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 16px',
        margin: '0 12px 16px',
        borderRadius: '12px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        width: 'calc(100% - 24px)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <div
        className="user-avatar"
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--primary-500) 0%, var(--primary-600) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '16px',
          fontWeight: 600,
        }}
      >
        {userName.charAt(0).toUpperCase()}
      </div>
      <div
        className="user-info"
        style={{
          flex: 1,
          textAlign: 'left',
        }}
      >
        <div
          className="user-name"
          style={{
            fontSize: '14px',
            fontWeight: 600,
            color: 'white',
          }}
        >
          {userName}
        </div>
        <div
          className="user-email"
          style={{
            fontSize: '12px',
            color: 'rgba(255, 255, 255, 0.6)',
          }}
        >
          {userEmail}
        </div>
      </div>
    </button>
  );
}
