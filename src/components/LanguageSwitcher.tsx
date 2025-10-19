'use client';

import { useTranslation } from 'react-i18next';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const activeLanguage = i18n.language || 'vi';

  return (
    <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
      <button 
        onClick={() => i18n.changeLanguage('en')} 
        className={`px-3 py-1 text-sm rounded-md transition-colors ${
          activeLanguage === 'en' 
            ? 'bg-white text-gray-900 dark:bg-gray-700 dark:text-gray-100' 
            : 'text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700/50'
        }`}>
          EN
      </button>
      <button 
        onClick={() => i18n.changeLanguage('vi')} 
        className={`px-3 py-1 text-sm rounded-md transition-colors ${
          activeLanguage === 'vi' 
            ? 'bg-white text-gray-900 dark:bg-gray-700 dark:text-gray-100' 
            : 'text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700/50'
        }`}>
          VI
      </button>
    </div>
  );
}
