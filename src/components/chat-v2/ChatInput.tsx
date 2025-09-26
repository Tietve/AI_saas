import React, { useRef, useEffect, useState } from 'react'
import { Send, Paperclip, Mic, StopCircle, X, FileText, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { VoiceRecorder } from './VoiceRecorder'
import { PromptsLibrary } from './PromptsLibrary'
import styles from '@/styles/components/chat/input.module.css'

interface Attachment {
    id: string
    name: string
    type: string
    size: number
    url?: string
}

interface ChatInputProps {
    value: string
    onChange: (value: string) => void
    onSend: () => void
    onStop?: () => void
    isLoading: boolean
    disabled: boolean
    attachments?: Attachment[]
    onUpload?: (files: FileList) => void
    onRemoveAttachment?: (id: string) => void
    isUploading?: boolean
    placeholder?: string
}

export function ChatInput({
                              value,
                              onChange,
                              onSend,
                              onStop,
                              isLoading,
                              disabled,
                              attachments = [],
                              onUpload,
                              onRemoveAttachment,
                              isUploading,
                              placeholder = "Message..."
                          }: ChatInputProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Auto-resize textarea with smooth transition
    useEffect(() => {
        const textarea = textareaRef.current
        if (!textarea) return

        const resizeTextarea = () => {
            // Reset height to auto to get the correct scrollHeight
            textarea.style.height = 'auto'
            
            // Calculate new height based on content
            const scrollHeight = textarea.scrollHeight
            const lineHeight = 24 // Base line height
            const minHeight = 24 // Single line height
            const maxHeight = 240 // Max height (10 lines)
            
            // Calculate new height
            const newHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight)
            
            // Only update if height actually changed significantly (prevent micro-adjustments)
            const currentHeight = parseInt(textarea.style.height) || minHeight
            if (Math.abs(newHeight - currentHeight) > 1) {
                textarea.style.height = newHeight + 'px'
            }
        }

        // Use requestAnimationFrame for smoother updates
        const rafId = requestAnimationFrame(resizeTextarea)
        
        return () => cancelAnimationFrame(rafId)
    }, [value])

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            if (!disabled && value.trim() && !isLoading) {
                onSend()
            }
        }
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && onUpload) {
            onUpload(e.target.files)
            e.target.value = '' // Reset input
        }
    }

    return (
        <div className={styles.inputWrapper}>
            {/* Attachments Preview */}
            {attachments.length > 0 && (
                <div className={styles.attachmentsPreview}>
                    {attachments.map(attachment => (
                        <div key={attachment.id} className={styles.attachmentChip}>
                            {attachment.type.startsWith('image/') ?
                                <ImageIcon size={14} /> :
                                <FileText size={14} />
                            }
                            <span className={styles.attachmentName}>{attachment.name}</span>
                            {onRemoveAttachment && (
                                <button
                                    onClick={() => onRemoveAttachment(attachment.id)}
                                    className={styles.removeAttachment}
                                    type="button"
                                    title="Remove attachment"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            <div className={styles.inputContainer}>
                <div className={styles.inputBox}>
                    {/* File Upload */}
                    {onUpload && (
                        <>
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                accept="image/*,.pdf,.txt,.doc,.docx"
                                onChange={handleFileSelect}
                                className={styles.hiddenInput}
                                title="Upload files"
                            />

                            <Button
                                variant="ghost"
                                icon={<Paperclip size={18} />}
                                onClick={() => fileInputRef.current?.click()}
                                disabled={disabled || isUploading}
                                className={styles.attachButton}
                                type="button"
                            />
                        </>
                    )}

                    {/* Voice Recorder */}
                    <VoiceRecorder 
                        onTranscript={(text) => {
                            onChange(value + ' ' + text)
                        }}
                        disabled={disabled}
                    />

                    {/* Prompts Library */}
                    <PromptsLibrary 
                        onSelectPrompt={(prompt) => {
                            onChange(prompt + '\n\n')
                        }}
                    />

                    <textarea
                        ref={textareaRef}
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        disabled={disabled || isLoading}
                        className={styles.textarea}
                    />

                    {/* Send/Stop Button */}
                    {isLoading && onStop ? (
                        <Button
                            variant="ghost"
                            icon={<StopCircle size={18} />}
                            onClick={onStop}
                            className={styles.stopButton}
                            type="button"
                        />
                    ) : (
                        <Button
                            variant="ghost"
                            icon={<Send size={18} />}
                            onClick={onSend}
                            disabled={disabled || (!value.trim() && attachments.length === 0)}
                            className={styles.sendButton}
                            type="button"
                        />
                    )}
                </div>

                <div className={styles.inputHint}>
                    {isLoading ? (
                        <span>Stop generating...</span>
                    ) : (
                        <span>Press Enter to send, Shift+Enter for new line</span>
                    )}
                </div>
            </div>
        </div>
    )
}