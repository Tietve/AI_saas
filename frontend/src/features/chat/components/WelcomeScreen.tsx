import { useTranslation } from 'react-i18next';

interface WelcomeScreenProps {
  onSuggestedPrompt?: (prompt: string) => void;
  userName?: string;
}

export function WelcomeScreen({ userName = 'Bạn' }: WelcomeScreenProps) {
  const { t } = useTranslation();

  return (
    <div
      className="chat-area fade-in"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent',
        position: 'relative',
        transition: 'all 0.3s ease',
        width: '100%',
        textAlign: 'center', // ✨ Ensure text alignment
      }}
    >
      {/* Simple Greeting */}
      <h1
        style={{
          fontSize: '32px',
          fontWeight: 600,
          color: 'var(--text-primary)',
          marginBottom: '8px',
          textAlign: 'center',
        }}
      >
        Start a conversation
      </h1>
      <p
        style={{
          fontSize: '16px',
          color: 'var(--text-secondary)',
          textAlign: 'center',
          lineHeight: 1.6,
        }}
      >
        {t('chat.welcome.greeting', { userName })}
      </p>
    </div>
  );
}
