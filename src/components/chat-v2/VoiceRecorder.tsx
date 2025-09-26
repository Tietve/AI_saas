import React, { useState, useRef } from 'react'
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import styles from '@/styles/components/chat/voice.module.css'

interface VoiceRecorderProps {
    onTranscript: (text: string) => void
    disabled?: boolean
}

export function VoiceRecorder({ onTranscript, disabled }: VoiceRecorderProps) {
    const [isRecording, setIsRecording] = useState(false)
    const [isPlaying, setIsPlaying] = useState(false)
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const audioChunks = useRef<Blob[]>([])

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            const mediaRecorder = new MediaRecorder(stream)
            mediaRecorderRef.current = mediaRecorder
            audioChunks.current = []

            mediaRecorder.ondataavailable = (event) => {
                audioChunks.current.push(event.data)
            }

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' })
                // Gửi đến API transcribe (cần implement API endpoint)
                await transcribeAudio(audioBlob)
                stream.getTracks().forEach(track => track.stop())
            }

            mediaRecorder.start()
            setIsRecording(true)
        } catch (error) {
            console.error('Error accessing microphone:', error)
            alert('Cannot access microphone. Please check permissions.')
        }
    }

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop()
            setIsRecording(false)
        }
    }

    const transcribeAudio = async (audioBlob: Blob) => {
        // Mock implementation - thay bằng API thật
        // const formData = new FormData()
        // formData.append('audio', audioBlob)
        // const response = await fetch('/api/transcribe', { method: 'POST', body: formData })
        // const { text } = await response.json()
        // onTranscript(text)

        // Mock response
        setTimeout(() => {
            onTranscript("This is a test transcription")
        }, 1000)
    }

    const speakText = (text: string) => {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text)
            utterance.onstart = () => setIsPlaying(true)
            utterance.onend = () => setIsPlaying(false)
            speechSynthesis.speak(utterance)
        }
    }

    const stopSpeaking = () => {
        speechSynthesis.cancel()
        setIsPlaying(false)
    }

    return (
        <div className={styles.voiceContainer}>
            <Button
                variant="ghost"
                icon={isRecording ? <MicOff size={18} /> : <Mic size={18} />}
                onClick={isRecording ? stopRecording : startRecording}
                disabled={disabled}
                className={`${styles.voiceButton} ${isRecording ? styles.recording : ''}`}
                title={isRecording ? "Stop recording" : "Start recording"}
            />

            {isPlaying && (
                <Button
                    variant="ghost"
                    icon={<VolumeX size={18} />}
                    onClick={stopSpeaking}
                    className={styles.speakButton}
                    title="Stop speaking"
                />
            )}
        </div>
    )
}