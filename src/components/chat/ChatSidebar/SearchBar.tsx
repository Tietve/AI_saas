import React from 'react'

interface SearchBarProps {
    value: string
    onChange: (value: string) => void
}

export const SearchBar: React.FC<SearchBarProps> = ({ value, onChange }) => {
    return (
        <div className="chat-search">
            <input
                type="text"
                placeholder="Tìm kiếm hội thoại..."
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
        </div>
    )
}
