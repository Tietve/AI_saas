import React from 'react'

export const WelcomeScreen: React.FC = () => {
    return (
        <div className="max-w-3xl mx-auto text-center py-12">
            <div className="mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20
                              bg-gradient-to-br from-blue-500 to-purple-600
                              rounded-full shadow-lg mb-4">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-4l-4 4z" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Chào mừng đến với AI Assistant Hub
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                    Trò chuyện với nhiều mô hình AI khác nhau
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                <div className="p-4 bg-white dark:bg-gray-800 rounded-xl
                              border border-gray-200 dark:border-gray-700">
                    <div className="text-2xl mb-2">💡</div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                        Đa dạng Models
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Lựa chọn từ GPT-4, Claude, Gemini và nhiều hơn
                    </p>
                </div>

                <div className="p-4 bg-white dark:bg-gray-800 rounded-xl
                              border border-gray-200 dark:border-gray-700">
                    <div className="text-2xl mb-2">🎭</div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                        Bot Personalities
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Trò chuyện với các nhân vật AI độc đáo
                    </p>
                </div>

                <div className="p-4 bg-white dark:bg-gray-800 rounded-xl
                              border border-gray-200 dark:border-gray-700">
                    <div className="text-2xl mb-2">⚡</div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                        Tốc độ & Chất lượng
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Tối ưu cho hiệu suất và độ chính xác
                    </p>
                </div>
            </div>

            <div className="mt-8 text-sm text-gray-500 dark:text-gray-400">
                <p>💡 Mẹo: Nhấn <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">Ctrl</kbd> + <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">Enter</kbd> để gửi tin nhắn nhanh</p>
            </div>
        </div>
    )
}
