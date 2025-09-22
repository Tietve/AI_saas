

import { ModelOption } from '../shared/types'
import { AVAILABLE_MODELS, PROVIDER_STYLES, SPEED_STYLES } from '../shared/constants'
import { useState, useRef, useEffect } from 'react'

interface ModelSelectorProps {
    selectedModel: string
    onModelChange: (modelId: string) => void
    disabled?: boolean
}

export function ModelSelector({ selectedModel, onModelChange, disabled }: ModelSelectorProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const dropdownRef = useRef<HTMLDivElement>(null)

    const currentModel = AVAILABLE_MODELS.find(m => m.id === selectedModel)
    const filteredModels = AVAILABLE_MODELS.filter(m =>
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.provider.toLowerCase().includes(searchQuery.toLowerCase())
    )

    // Group models by provider
    const groupedModels = filteredModels.reduce((acc, model) => {
        if (!acc[model.provider]) {
            acc[model.provider] = []
        }
        acc[model.provider].push(model)
        return acc
    }, {} as Record<string, ModelOption[]>)

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    if (!currentModel) return null

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                disabled={disabled}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all
                          ${currentModel ? PROVIDER_STYLES[currentModel.provider].bgLight : 'bg-gray-100'}
                          ${currentModel ? PROVIDER_STYLES[currentModel.provider].bgDark : 'dark:bg-gray-800'}
                          hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed`}>

                <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-xs font-medium"
                          style={{
                              background: SPEED_STYLES[currentModel.speed].bg,
                              color: SPEED_STYLES[currentModel.speed].color,
                          }}>
                        {SPEED_STYLES[currentModel.speed].icon}
                        {SPEED_STYLES[currentModel.speed].label}
                    </span>

                    <span className="font-medium text-gray-900 dark:text-gray-100">
                        {currentModel.name}
                    </span>
                </div>

                <svg className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                     fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-900
                              rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700
                              overflow-hidden z-50">

                    {}
                    <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                        <input
                            type="text"
                            placeholder="Search models..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg
                                     focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {}
                    <div className="max-h-96 overflow-y-auto">
                        {Object.entries(groupedModels).map(([provider, models]) => (
                            <div key={provider}>
                                <div className="px-3 py-2 text-xs font-semibold text-gray-500
                                              bg-gray-50 dark:bg-gray-800 uppercase">
                                    {provider}
                                </div>

                                {models.map(model => (
                                    <button
                                        key={model.id}
                                        onClick={() => {
                                            onModelChange(model.id)
                                            setIsOpen(false)
                                        }}
                                        className={`w-full px-3 py-3 text-left hover:bg-gray-50 
                                                  dark:hover:bg-gray-800 transition-colors
                                                  ${model.id === selectedModel ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>

                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-medium">
                                                        {model.name}
                                                    </span>
                                                    <span className="px-2 py-0.5 rounded text-xs"
                                                          style={{
                                                              background: SPEED_STYLES[model.speed].bg,
                                                              color: SPEED_STYLES[model.speed].color,
                                                          }}>
                                                        {SPEED_STYLES[model.speed].icon} {SPEED_STYLES[model.speed].label}
                                                    </span>
                                                </div>

                                                <div className="text-xs text-gray-600 dark:text-gray-400">
                                                    {model.bestFor} • {model.contextWindow}
                                                </div>

                                                <div className="flex gap-1 mt-1">
                                                    {model.capabilities.slice(0, 3).map((cap, idx) => (
                                                        <span key={idx} className="text-xs px-1.5 py-0.5
                                                                                 bg-gray-100 dark:bg-gray-700
                                                                                 rounded">
                                                            {cap}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>

                                            {model.id === selectedModel && (
                                                <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-1"
                                                     fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd"
                                                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                                                </svg>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}