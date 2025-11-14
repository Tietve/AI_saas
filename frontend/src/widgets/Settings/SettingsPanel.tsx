import { useState } from 'react';
import { useThemeStore } from '@/shared/stores/themeStore';
import { themeColors, type ThemeName } from '@/shared/config/theme';
import { LanguageSwitcher } from '@/features/language/components/LanguageSwitcher';
import { useTranslation } from 'react-i18next';

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
}

const allThemes: { name: ThemeName; display: string; emoji: string }[] = [
  { name: 'default', display: 'Fir Green', emoji: '🌲' },
  { name: 'ocean', display: 'Ocean Blue', emoji: '🌊' },
  { name: 'purple', display: 'Purple Dream', emoji: '💜' },
  { name: 'orange', display: 'Sunset Orange', emoji: '🌅' },
  { name: 'rose', display: 'Rose Pink', emoji: '🌹' },
  { name: 'lavender', display: 'Lavender', emoji: '💐' },
  { name: 'mint', display: 'Mint Fresh', emoji: '🍃' },
  { name: 'coral', display: 'Coral Red', emoji: '🪸' },
  { name: 'white', display: 'Pure White', emoji: '⚪' },
  { name: 'black', display: 'Pure Black', emoji: '⚫' },
];

export function SettingsPanel({ open, onClose }: SettingsPanelProps) {
  const { t } = useTranslation();
  const { themeName, darkMode, setTheme, toggleDarkMode } = useThemeStore();
  const [activeTab, setActiveTab] = useState(0);

  const tabs = [
    t('settings.title'),
    t('settings.theme.title'),
    'Mô hình',
    'Nâng cao'
  ];

  if (!open) return null;

  return (
    <div className="modal-overlay active" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, animation: 'fadeIn 0.2s ease' }}>
      <div className="modal slide-up" style={{ background: '#1a1a1a', border: '2px solid var(--primary-600)', borderRadius: '16px', width: '90%', maxWidth: '700px', maxHeight: '80vh', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)' }}>
        {/* Header */}
        <div className="modal-header" style={{ padding: '24px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 className="modal-title" style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)' }}>{t('settings.title')}</h2>
          <button className="modal-close" onClick={onClose} style={{ width: '32px', height: '32px', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', borderRadius: '6px', transition: 'all 0.2s' }}>
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="modal-tabs" style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', padding: '0 24px', gap: '4px' }}>
          {tabs.map((tab, index) => (
            <button
              key={index}
              className={`modal-tab ${activeTab === index ? 'active' : ''}`}
              onClick={() => setActiveTab(index)}
              style={{
                padding: '12px 20px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                color: activeTab === index ? 'var(--primary-600)' : 'var(--text-secondary)',
                fontSize: '14px',
                fontWeight: 500,
                borderBottom: activeTab === index ? '2px solid var(--primary-600)' : '2px solid transparent',
                transition: 'all 0.2s',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="modal-content" style={{ padding: '24px', maxHeight: '60vh', overflowY: 'auto' }}>
          {/* Tab 0: Chung */}
          {activeTab === 0 && (
            <div className="tab-panel active fade-in">
              {/* Language Selector */}
              <div className="setting-group" style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>
                  {t('settings.language.title')}
                </h3>
                <div className="setting-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'rgba(0, 0, 0, 0.3)', borderRadius: '8px' }}>
                  <label style={{ fontSize: '13px', color: 'var(--text-primary)' }}>Chọn ngôn ngữ / Select language</label>
                  <LanguageSwitcher />
                </div>
              </div>

              <div className="setting-group" style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>Cài đặt chung</h3>
                <div className="setting-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'rgba(0, 0, 0, 0.3)', borderRadius: '8px', marginBottom: '8px' }}>
                  <label style={{ fontSize: '13px', color: 'var(--text-primary)' }}>Tự động lưu cuộc trò chuyện</label>
                  <input type="checkbox" defaultChecked />
                </div>
                <div className="setting-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'rgba(0, 0, 0, 0.3)', borderRadius: '8px', marginBottom: '8px' }}>
                  <label style={{ fontSize: '13px', color: 'var(--text-primary)' }}>Hiển thị timestamp</label>
                  <input type="checkbox" defaultChecked />
                </div>
                <div className="setting-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'rgba(0, 0, 0, 0.3)', borderRadius: '8px' }}>
                  <label style={{ fontSize: '13px', color: 'var(--text-primary)' }}>Âm thanh thông báo</label>
                  <input type="checkbox" />
                </div>
              </div>
            </div>
          )}

          {/* Tab 1: Giao diện */}
          {activeTab === 1 && (
            <div className="tab-panel active fade-in">
              <div className="setting-group" style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>🎨 Color Themes - Chọn màu chủ đạo</h3>
                <div className="color-schemes" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                  {allThemes.map((theme) => {
                    const colors = themeColors[theme.name];
                    const isActive = themeName === theme.name;
                    return (
                      <div
                        key={theme.name}
                        className={`color-scheme ${isActive ? 'active' : ''}`}
                        onClick={() => setTheme(theme.name)}
                        style={{
                          padding: '16px',
                          border: isActive ? '2px solid var(--primary-600)' : '2px solid var(--border-color)',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          textAlign: 'center',
                          background: isActive ? 'rgba(0, 0, 0, 0.3)' : 'transparent',
                        }}
                      >
                        <div className="color-preview" style={{ display: 'flex', gap: '4px', marginBottom: '8px', justifyContent: 'center' }}>
                          <div style={{ width: '24px', height: '24px', borderRadius: '4px', background: colors[500] }}></div>
                          <div style={{ width: '24px', height: '24px', borderRadius: '4px', background: colors[400] }}></div>
                          <div style={{ width: '24px', height: '24px', borderRadius: '4px', background: colors[600] }}></div>
                        </div>
                        <div className="color-scheme-name" style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)' }}>
                          {theme.emoji} {theme.display}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '12px', fontStyle: 'italic' }}>
                  💡 Mỗi theme đều hỗ trợ cả chế độ sáng và tối
                </p>
              </div>

              <div className="setting-group" style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>Dark Mode</h3>
                <div className="setting-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'rgba(0, 0, 0, 0.3)', borderRadius: '8px' }}>
                  <label style={{ fontSize: '13px', color: 'var(--text-primary)' }}>Chế độ tối: {darkMode ? 'Bật' : 'Tắt'}</label>
                  <div
                    onClick={toggleDarkMode}
                    style={{
                      position: 'relative',
                      width: '48px',
                      height: '24px',
                      background: darkMode ? 'var(--primary-500)' : 'rgba(0, 0, 0, 0.2)',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                    }}
                  >
                    <div style={{
                      position: 'absolute',
                      top: '2px',
                      left: darkMode ? '26px' : '2px',
                      width: '20px',
                      height: '20px',
                      background: 'white',
                      borderRadius: '50%',
                      transition: 'all 0.3s',
                    }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Mô hình */}
          {activeTab === 2 && (
            <div className="tab-panel active fade-in">
              <div className="setting-group">
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>Mô hình AI</h3>
                <div className="setting-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'rgba(0, 0, 0, 0.3)', borderRadius: '8px', marginBottom: '8px' }}>
                  <label style={{ fontSize: '13px', color: 'var(--text-primary)' }}>Mô hình mặc định</label>
                  <select style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                    <option>GPT-4</option>
                    <option>GPT-3.5 Turbo</option>
                    <option>Claude 3</option>
                  </select>
                </div>
                <div className="setting-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'rgba(0, 0, 0, 0.3)', borderRadius: '8px', marginBottom: '8px' }}>
                  <label style={{ fontSize: '13px', color: 'var(--text-primary)' }}>Temperature</label>
                  <input type="range" min="0" max="100" defaultValue="70" style={{ width: '200px' }} />
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Nâng cao */}
          {activeTab === 3 && (
            <div className="tab-panel active fade-in">
              <div className="setting-group">
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>Cài đặt nâng cao</h3>
                <div className="setting-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'rgba(0, 0, 0, 0.3)', borderRadius: '8px', marginBottom: '8px' }}>
                  <label style={{ fontSize: '13px', color: 'var(--text-primary)' }}>Streaming responses</label>
                  <input type="checkbox" defaultChecked />
                </div>
                <div className="setting-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'rgba(0, 0, 0, 0.3)', borderRadius: '8px', marginBottom: '8px' }}>
                  <label style={{ fontSize: '13px', color: 'var(--text-primary)' }}>Code syntax highlighting</label>
                  <input type="checkbox" defaultChecked />
                </div>
                <div className="setting-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'rgba(0, 0, 0, 0.3)', borderRadius: '8px' }}>
                  <label style={{ fontSize: '13px', color: 'var(--text-primary)' }}>Keyboard shortcuts</label>
                  <input type="checkbox" defaultChecked />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
