import React from 'react'

export const WelcomeScreen: React.FC = () => {
    return (
        <div className="welcome">
            <div className="welcome__icon">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-4l-4 4z" />
                </svg>
            </div>

            <h2 className="welcome__title">Chào mừng đến với AI Assistant Hub</h2>
            <p className="welcome__subtitle">Bắt đầu cuộc trò chuyện với những nhân vật AI đầy cảm hứng</p>

            <div className="welcome-grid">
                <div className="welcome-card">
                    <div className="welcome-card__icon">💡</div>
                    <h3 className="welcome-card__title">Đa dạng Model</h3>
                    <p className="welcome-card__desc">Lựa chọn từ GPT-4, Claude, Gemini và nhiều hơn</p>
                </div>

                <div className="welcome-card">
                    <div className="welcome-card__icon">🎭</div>
                    <h3 className="welcome-card__title">Bot cá tính</h3>
                    <p className="welcome-card__desc">Trải nghiệm trò chuyện với những nhân vật AI độc đáo</p>
                </div>

                <div className="welcome-card">
                    <div className="welcome-card__icon">⚡</div>
                    <h3 className="welcome-card__title">Tốc độ &amp; chất lượng</h3>
                    <p className="welcome-card__desc">Tối ưu cho hiệu suất và độ chính xác trong mọi phiên chat</p>
                </div>
            </div>

            <div className="welcome__hint">
                💡 Mẹo: Nhấn <kbd>Ctrl</kbd> + <kbd>Enter</kbd> để gửi tin nhắn nhanh
            </div>
        </div>
    )
}
