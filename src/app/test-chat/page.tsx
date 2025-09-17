'use client';

import { useState } from 'react';

export default function TestChat() {
    const [message, setMessage] = useState('');
    const [response, setResponse] = useState('');
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState<any>(null);

    const testChat = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message,
                    conversationId: 'test-123'
                })
            });
            const data = await res.json();
            setResponse(data.content);
            setStats({
                provider: data.provider,
                model: data.model,
                cost: data.usage.totalCost,
                tokens: data.usage.promptTokens + data.usage.completionTokens,
                latency: data.latency
            });
        } catch (error) {
            console.error('Error:', error);
        }
        setLoading(false);
    };

    const checkHealth = async () => {
        const res = await fetch('/api/providers/health');
        const data = await res.json();
        alert(JSON.stringify(data, null, 2));
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">Test Multi-Provider Gateway</h1>

            <div className="space-y-4">
        <textarea
            className="w-full p-2 border rounded"
            rows={4}
            placeholder="Enter your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
        />

                <div className="flex gap-2">
                    <button
                        onClick={testChat}
                        disabled={loading}
                        className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
                    >
                        {loading ? 'Processing...' : 'Send'}
                    </button>

                    <button
                        onClick={checkHealth}
                        className="px-4 py-2 bg-green-500 text-white rounded"
                    >
                        Check Provider Health
                    </button>
                </div>

                {response && (
                    <div className="p-4 bg-gray-100 rounded">
                        <h3 className="font-bold mb-2">Response:</h3>
                        <p>{response}</p>
                    </div>
                )}

                {stats && (
                    <div className="p-4 bg-blue-50 rounded">
                        <h3 className="font-bold mb-2">Stats:</h3>
                        <ul className="text-sm">
                            <li>Provider: {stats.provider}</li>
                            <li>Model: {stats.model}</li>
                            <li>Cost: ${stats.cost?.toFixed(6)}</li>
                            <li>Tokens: {stats.tokens}</li>
                            <li>Latency: {stats.latency}ms</li>
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}