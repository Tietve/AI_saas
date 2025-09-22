import React from 'react'

interface SearchBarProps {
    value: string
    onChange: (value: string) => void
}

export const SearchBar: React.FC<SearchBarProps> = ({ value, onChange }) => {
    return (
        <div className="relative">
            <input
                type="text"
                placeholder="Tìm kiếm hội thoại..."
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800
                         border border-gray-200 dark:border-gray-700 rounded-lg
                         text-sm focus:outline-none focus:ring-2 focus:ring-blue-500
                         placeholder-gray-500 dark:placeholder-gray-400"
            />
            <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400"
                 fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
        </div>
    )
}