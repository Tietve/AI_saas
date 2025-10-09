import React, { useState, useRef, useEffect } from 'react'
import { MoreVertical, Download, Code, Settings, Palette } from 'lucide-react'
import { Button } from '@/components/ui/button'
import styles from '@/styles/components/chat/actions-menu.module.css'

interface ActionsMenuProps {
    onExportClick?: () => void
    onSystemPromptClick?: () => void
    onThemeClick?: () => void
    onSettingsClick?: () => void
    hasMessages?: boolean
    showSystemPrompt?: boolean
}

export function ActionsMenu(props: ActionsMenuProps) {
    const [isOpen, setIsOpen] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    return (
        <div className={styles.actionsMenu} ref={menuRef}>
            <Button
                variant="ghost"
                icon={<MoreVertical size={18} />}
                onClick={() => setIsOpen(!isOpen)}
                className={isOpen ? styles.active : ''}
                title="More actions"
            />

            {isOpen && (
                <div className={styles.dropdown}>
                    {props.hasMessages && props.onExportClick && (
                        <button
                            className={styles.menuItem}
                            onClick={() => {
                                props.onExportClick?.()
                                setIsOpen(false)
                            }}
                        >
                            <Download size={16} />
                            <span>Export conversation</span>
                        </button>
                    )}

                    {props.onSystemPromptClick && (
                        <button
                            className={`${styles.menuItem} ${props.showSystemPrompt ? styles.activeItem : ''}`}
                            onClick={() => {
                                props.onSystemPromptClick?.()
                                setIsOpen(false)
                            }}
                        >
                            <Code size={16} />
                            <span>System prompt</span>
                        </button>
                    )}

                    <div className={styles.divider} />

                    {props.onThemeClick && (
                        <button
                            className={styles.menuItem}
                            onClick={() => {
                                props.onThemeClick?.()
                                setIsOpen(false)
                            }}
                        >
                            <Palette size={16} />
                            <span>Change theme</span>
                        </button>
                    )}

                    {props.onSettingsClick && (
                        <button
                            className={styles.menuItem}
                            onClick={() => {
                                props.onSettingsClick?.()
                                setIsOpen(false)
                            }}
                        >
                            <Settings size={16} />
                            <span>Settings</span>
                        </button>
                    )}
                </div>
            )}
        </div>
    )
}
