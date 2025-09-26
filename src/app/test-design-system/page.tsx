'use client'

import { Button } from '@/components/ui/button'
import { Plus, Send, Settings, Trash2 } from 'lucide-react'

export default function TestDesignSystem() {
    return (
        <div className="container mx-auto py-8">
            <h1 className="text-3xl font-bold mb-8">Design System Test</h1>

            {/* Typography */}
            <section className="mb-12">
                <h2 className="text-2xl font-semibold mb-4">Typography</h2>
                <div className="space-y-2">
                    <h1 className="text-4xl">Heading 1</h1>
                    <h2 className="text-3xl">Heading 2</h2>
                    <h3 className="text-2xl">Heading 3</h3>
                    <h4 className="text-xl">Heading 4</h4>
                    <p className="text-base">Body text - Lorem ipsum dolor sit amet</p>
                    <p className="text-sm text-secondary">Small secondary text</p>
                    <p className="text-xs text-tertiary">Extra small tertiary text</p>
                </div>
            </section>

            {/* Colors */}
            <section className="mb-12">
                <h2 className="text-2xl font-semibold mb-4">Colors</h2>
                <div className="grid grid-cols-4 gap-4">
                    <div className="p-4 bg-primary text-white rounded">Primary</div>
                    <div className="p-4 bg-secondary text-white rounded">Secondary</div>
                    <div className="p-4 bg-success text-white rounded">Success</div>
                    <div className="p-4 bg-error text-white rounded">Error</div>
                    <div className="p-4 bg-warning text-black rounded">Warning</div>
                    <div className="p-4 bg-info text-white rounded">Info</div>
                    <div className="p-4 border rounded">Default</div>
                    <div className="p-4 bg-gray-100 rounded">Gray</div>
                </div>
            </section>

            {/* Buttons */}
            <section className="mb-12">
                <h2 className="text-2xl font-semibold mb-4">Buttons</h2>
                <div className="space-y-4">
                    <div className="flex gap-4 flex-wrap">
                        <Button variant="primary">Primary</Button>
                        <Button variant="secondary">Secondary</Button>
                        <Button variant="ghost">Ghost</Button>
                        <Button variant="danger">Danger</Button>
                    </div>

                    <div className="flex gap-4 flex-wrap">
                        <Button size="xs">Extra Small</Button>
                        <Button size="sm">Small</Button>
                        <Button size="md">Medium</Button>
                        <Button size="lg">Large</Button>
                        <Button size="xl">Extra Large</Button>
                    </div>

                    <div className="flex gap-4 flex-wrap">
                        <Button icon={<Plus size={16} />}>New Chat</Button>
                        <Button variant="secondary" icon={<Settings size={16} />}>Settings</Button>
                        <Button variant="danger" icon={<Trash2 size={16} />}>Delete</Button>
                        <Button variant="ghost" icon={<Send size={16} />} />
                    </div>

                    <div className="flex gap-4 flex-wrap">
                        <Button loading>Loading...</Button>
                        <Button disabled>Disabled</Button>
                        <Button fullWidth>Full Width</Button>
                    </div>
                </div>
            </section>

            {/* Spacing */}
            <section className="mb-12">
                <h2 className="text-2xl font-semibold mb-4">Spacing Scale</h2>
                <div className="space-y-2">
                    {[0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24].map(space => (
                        <div key={space} className="flex items-center gap-4">
                            <span className="text-sm w-16">space-{space}</span>
                            <div className={`h-8 bg-brand-primary`} style={{ width: `${space * 0.25}rem` }}></div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    )
}