import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import vi from '../locales/vi.json';
import en from '../locales/en.json';

// Khởi tạo i18next với tiếng Việt là ngôn ngữ mặc định
i18n
  .use(LanguageDetector) // Tự động detect ngôn ngữ từ browser (optional)
  .use(initReactI18next) // Kết nối với React
  .init({
    resources: {
      vi: { translation: vi },
      en: { translation: en },
    },
    lng: 'vi', // Ngôn ngữ mặc định là tiếng Việt
    fallbackLng: 'vi', // Fallback về tiếng Việt nếu không tìm thấy translation
    debug: import.meta.env.DEV, // Bật debug mode trong development

    interpolation: {
      escapeValue: false, // React đã tự động escape
    },

    // Cấu hình language detector
    detection: {
      order: ['localStorage', 'navigator'], // Ưu tiên localStorage, sau đó browser language
      caches: ['localStorage'], // Cache language preference vào localStorage
      lookupLocalStorage: 'i18nextLng', // Key trong localStorage
    },
  });

export default i18n;
