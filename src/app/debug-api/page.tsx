'use client'

import { useState } from 'react'

export default function DebugAPIPage() {
    const [conversationId, setConversationId] = useState('cmgxax24g001anyv9bxq26td6')
    const [result, setResult] = useState<any>(null)
    const [loading, setLoading] = useState(false)

    const testMessagesAPI = async () => {
        setLoading(true)
        setResult(null)

        try {
            const url = `/api/conversations/${conversationId}/messages?limit=100`
            console.log('Testing:', url)

            const startTime = Date.now()
            const response = await fetch(url, {
                method: 'GET',
                credentials: 'include', // Important for cookies
                headers: {
                    'Content-Type': 'application/json',
                },
            })
            const duration = Date.now() - startTime

            const text = await response.text()
            let data
            try {
                data = JSON.parse(text)
            } catch {
                data = { raw: text }
            }

            setResult({
                success: response.ok,
                status: response.status,
                statusText: response.statusText,
                duration: `${duration}ms`,
                headers: Object.fromEntries(response.headers.entries()),
                data,
            })

            console.log('Response:', {
                status: response.status,
                data,
            })
        } catch (error: any) {
            setResult({
                success: false,
                error: error.message,
                stack: error.stack,
            })
            console.error('Error:', error)
        } finally {
            setLoading(false)
        }
    }

    const testHealthAPI = async () => {
        setLoading(true)
        setResult(null)

        try {
            const response = await fetch('/api/health')
            const data = await response.json()

            setResult({
                success: response.ok,
                status: response.status,
                data,
            })
        } catch (error: any) {
            setResult({
                success: false,
                error: error.message,
            })
        } finally {
            setLoading(false)
        }
    }

    const checkAuth = async () => {
        setLoading(true)
        setResult(null)

        try {
            const response = await fetch('/api/me', {
                credentials: 'include',
            })
            const data = await response.json()

            setResult({
                success: response.ok,
                status: response.status,
                authenticated: response.ok,
                data,
            })
        } catch (error: any) {
            setResult({
                success: false,
                error: error.message,
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{ padding: '20px', fontFamily: 'monospace' }}>
            <h1>🐛 API Debug Tool</h1>
            <p style={{ color: '#666' }}>
                Test API endpoints directly from the browser to debug production issues.
            </p>

            <div style={{ marginTop: '20px', padding: '20px', background: '#f5f5f5', borderRadius: '8px' }}>
                <h3>Test Messages API</h3>
                <div style={{ marginBottom: '10px' }}>
                    <label>
                        Conversation ID:{' '}
                        <input
                            type="text"
                            value={conversationId}
                            onChange={(e) => setConversationId(e.target.value)}
                            style={{
                                padding: '8px',
                                width: '400px',
                                fontFamily: 'monospace',
                                border: '1px solid #ccc',
                                borderRadius: '4px',
                            }}
                        />
                    </label>
                </div>
                <button
                    onClick={testMessagesAPI}
                    disabled={loading}
                    style={{
                        padding: '10px 20px',
                        background: loading ? '#ccc' : '#0070f3',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        marginRight: '10px',
                    }}
                >
                    {loading ? 'Testing...' : 'Test Messages API'}
                </button>
                <button
                    onClick={checkAuth}
                    disabled={loading}
                    style={{
                        padding: '10px 20px',
                        background: loading ? '#ccc' : '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        marginRight: '10px',
                    }}
                >
                    Check Auth
                </button>
                <button
                    onClick={testHealthAPI}
                    disabled={loading}
                    style={{
                        padding: '10px 20px',
                        background: loading ? '#ccc' : '#17a2b8',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                    }}
                >
                    Test Health
                </button>
            </div>

            {result && (
                <div
                    style={{
                        marginTop: '20px',
                        padding: '20px',
                        background: result.success ? '#d4edda' : '#f8d7da',
                        border: `1px solid ${result.success ? '#c3e6cb' : '#f5c6cb'}`,
                        borderRadius: '8px',
                    }}
                >
                    <h3>{result.success ? '✅ Success' : '❌ Error'}</h3>
                    <pre
                        style={{
                            background: '#fff',
                            padding: '15px',
                            borderRadius: '4px',
                            overflow: 'auto',
                            maxHeight: '500px',
                        }}
                    >
                        {JSON.stringify(result, null, 2)}
                    </pre>
                </div>
            )}

            <div style={{ marginTop: '30px', padding: '20px', background: '#fff3cd', borderRadius: '8px' }}>
                <h3>💡 Debugging Tips</h3>
                <ul>
                    <li>Open browser DevTools (F12) and check the Console tab for detailed logs</li>
                    <li>Check the Network tab to see the actual request/response</li>
                    <li>Verify you're logged in by clicking "Check Auth" button</li>
                    <li>If you get 401/403, try logging out and logging back in</li>
                    <li>If you get 400, check the response body for specific error details</li>
                    <li>Check Azure logs for server-side errors: <code>az webapp log tail --name firbox-api --resource-group firai-rg</code></li>
                </ul>
            </div>

            <div style={{ marginTop: '20px', padding: '15px', background: '#e7f3ff', borderRadius: '8px' }}>
                <h4>Common Issues:</h4>
                <ul>
                    <li><strong>400 Bad Request:</strong> Usually validation error or missing required fields</li>
                    <li><strong>401 Unauthorized:</strong> Not authenticated or session expired</li>
                    <li><strong>403 Forbidden:</strong> Authenticated but not authorized for this resource</li>
                    <li><strong>404 Not Found:</strong> Conversation doesn't exist or doesn't belong to you</li>
                    <li><strong>500 Server Error:</strong> Server-side error - check logs</li>
                </ul>
            </div>
        </div>
    )
}
