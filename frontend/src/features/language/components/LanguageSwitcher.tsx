import { useTranslation } from 'react-i18next';
import { useState } from 'react';

export const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const languages = [
    { code: 'vi', name: t('settings.language.vietnamese'), flag: '🇻🇳' },
    { code: 'en', name: t('settings.language.english'), flag: '🇬🇧' },
  ];

  const currentLanguage = languages.find((lang) => lang.code === i18n.language) || languages[0];

  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
    setIsOpen(false);
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Language Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          color: 'var(--text-primary)',
          fontSize: '13px',
          fontWeight: 500,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
        }}
      >
        <span style={{ fontSize: '18px' }}>{currentLanguage.flag}</span>
        <span>{currentLanguage.code.toUpperCase()}</span>
        <svg
          width="12"
          height="12"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth="2"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
          }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setIsOpen(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999,
            }}
          />

          {/* Menu */}
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              minWidth: '180px',
              background: 'var(--bg-secondary)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
              padding: '8px',
              zIndex: 1000,
              animation: 'fadeIn 0.15s ease',
            }}
          >
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 12px',
                  background: i18n.language === lang.code ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  fontWeight: i18n.language === lang.code ? 600 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background =
                    i18n.language === lang.code ? 'rgba(255, 255, 255, 0.08)' : 'transparent';
                }}
              >
                <span style={{ fontSize: '20px' }}>{lang.flag}</span>
                <span>{lang.name}</span>
                {i18n.language === lang.code && (
                  <svg
                    width="16"
                    height="16"
                    fill="none"
                    stroke="var(--primary-500)"
                    viewBox="0 0 24 24"
                    strokeWidth="3"
                    style={{ marginLeft: 'auto' }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
