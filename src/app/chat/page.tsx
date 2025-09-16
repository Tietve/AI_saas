import ChatClient from '@/components/chat/ChatClient'
import SidebarConversations from '@/components/chat/SidebarConversations'
import ConversationSettings from '@/components/chat/ConversationSettings'

export const dynamic = 'force-dynamic'

export default function ChatPage() {
    return (
        <div className="grid grid-cols-[280px_1fr] h-[100vh]">
            <aside className="border-r overflow-y-auto p-3">
                <SidebarConversations/>
            </aside>
            <main className="overflow-hidden p-4">
                <ChatClient/>
            </main>
            <main className="overflow-hidden p-4">
                <ConversationSettings/>
                <ChatClient/>
            </main>
        </div>
    )
}
