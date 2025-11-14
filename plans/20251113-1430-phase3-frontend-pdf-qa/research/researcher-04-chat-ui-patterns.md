# Modern Chat Interface Patterns for Q&A Systems with AI Responses

**Research Date:** 2025-11-13
**Focus:** UI/UX patterns for AI chat interfaces with source citations
**Target:** React/TypeScript implementation

---

## 1. MESSAGE LIST UI (User vs AI Messages)

### Layout Patterns
- **Alignment:** User messages right-aligned, AI messages left-aligned
- **Visual Distinction:** Different background colors (user: blue/accent, AI: gray/neutral)
- **Avatar Display:** AI avatar on left, user avatar on right (optional)
- **Spacing:** Consistent vertical spacing (12-16px between messages)

### Component Structure
```
<MessageList>
  <Message role="user" />
  <Message role="assistant" />
  <Message role="assistant" streaming={true} />
</MessageList>
```

### Best Practices
- Use `React.memo()` for message components with unique keys
- Implement virtual scrolling for 100+ messages (react-window/react-virtualized)
- Group consecutive messages by same sender
- Add timestamps (relative: "2 min ago" → absolute: "2:30 PM" on hover)

---

## 2. STREAMING TEXT ANIMATION

### Why Streaming Matters
- Reduces "time to first answer" perception
- Users expect streaming (ChatGPT, Bing, GitHub Copilot standard)
- Keeps users engaged vs. long loading states

### Implementation Approaches

**Smooth Streaming (Recommended)**
- Receive chunks from server as fast as possible
- Buffer chunks and display at consistent, readable pace
- Target: 33ms delay per character/word (~30 chars/second)
- Avoids jarring "burst" appearance

**Technical Stack**
- **Backend:** Server-Sent Events (SSE) or WebSocket
- **Frontend:** useChat hook from Vercel AI SDK
- **Animation:** CSS transitions + JavaScript timing

**Code Pattern**
```typescript
const { messages, input, handleSubmit, isLoading } = useChat({
  api: '/api/chat',
  streamMode: 'text'
})

// Display with character-by-character animation
<StreamingText
  content={message.content}
  isStreaming={message.streaming}
  delay={33} // ms per character
/>
```

### UX Guidelines
- Show cursor/blinking indicator during streaming
- Make streaming optional (user preference)
- Allow interrupting/stopping mid-stream
- Disable input while streaming (optional)

---

## 3. SOURCE CITATION DISPLAY

### Citation Patterns

**Inline Citations (Recommended for Q&A)**
```
"The capital of France is Paris[1]. It has been the capital
since 1944[2]."

[1] document-name.pdf (page 5)
[2] document-name.pdf (page 12)
```

**Visual Design**
- **Citation Pills:** Small superscript numbers `[1]` with hover preview
- **Hover Card:** Shows title, page number, short excerpt (2-3 lines)
- **Click Action:** Scrolls to source document section or opens modal

**Component Structure**
```typescript
<Message role="assistant">
  <MessageContent>
    The capital of France is Paris
    <Citation id="1" source={sources[0]} />
    . It has been...
  </MessageContent>
  <SourceList>
    <SourceCard source={sources[0]} />
    <SourceCard source={sources[1]} />
  </SourceList>
</Message>
```

### Best Practices (from AI UX Research)
- Place citations where users expect them (inline for sentence-level claims)
- Use metadata: document title, page number, file icon
- Allow hover for preview + click for full source
- Show broken/missing citations explicitly (don't hide gaps)
- Group repeated sources (show once, reference multiple times)

### shadcn/ui Pattern
```tsx
import { InlineCitation } from '@/components/ui/inline-citation'

<p>
  Content here <InlineCitation
    sourceId="src_123"
    title="Document.pdf"
    page={5}
  />
</p>
```

---

## 4. LOADING STATES (Typing Indicators)

### Types of Indicators

**1. Typing Dots (Most Common)**
```
AI is typing...  ● ● ●
```
- 3 animated dots with bounce/pulse effect
- CSS animation: staggered delays (0ms, 150ms, 300ms)

**2. Skeleton Loader**
- 2-3 pulsing gray lines mimicking text shape
- Better for longer wait times (>3 seconds)

**3. Spinner + Text**
- "Analyzing document..." with spinner
- Use for specific actions: searching, processing

### Implementation Guidelines
- Show typing indicator within 100ms of request
- Update every 2 seconds (typing_on event pattern)
- Remove immediately when first chunk arrives
- Don't block UI (show indicator without disabling input)

### Code Pattern
```typescript
{isLoading && (
  <div className="flex gap-2 items-center">
    <Avatar src="/ai-avatar.png" />
    <TypingIndicator />
  </div>
)}
```

---

## 5. AUTO-SCROLL BEHAVIOR

### Rules for Smart Auto-Scroll

**When to Auto-Scroll:**
- User is at bottom (scrollTop + clientHeight >= scrollHeight - 50px threshold)
- New message arrives (user or AI)
- Streaming text is updating

**When NOT to Auto-Scroll:**
- User manually scrolled up (reading history)
- User is selecting text
- User is interacting with citation hover cards

### Implementation Pattern
```typescript
const messagesEndRef = useRef<HTMLDivElement>(null)
const [shouldAutoScroll, setShouldAutoScroll] = useState(true)

// Detect manual scroll
const handleScroll = (e) => {
  const { scrollTop, scrollHeight, clientHeight } = e.target
  const isAtBottom = scrollHeight - scrollTop - clientHeight < 50
  setShouldAutoScroll(isAtBottom)
}

// Auto-scroll on new message
useEffect(() => {
  if (shouldAutoScroll && messagesEndRef.current) {
    messagesEndRef.current.scrollIntoView({
      behavior: 'smooth',
      block: 'end'
    })
  }
}, [messages, shouldAutoScroll])
```

### UX Enhancements
- Show "New message" pill when scrolled up
- Clicking pill scrolls to bottom
- Smooth scroll for better UX (behavior: 'smooth')

---

## 6. INPUT BOX WITH SUBMIT HANDLING

### Design Requirements
- Multi-line textarea (auto-expand up to max height)
- Submit on Enter (Shift+Enter for new line)
- Character/token counter (e.g., "450/4000 tokens")
- Clear/reset button
- File upload button (for PDF attachments)
- Disable during loading/streaming

### Component Structure
```tsx
<form onSubmit={handleSubmit} className="border-t p-4">
  <div className="flex gap-2">
    <Textarea
      value={input}
      onChange={handleInputChange}
      onKeyDown={handleKeyDown}
      placeholder="Ask a question..."
      disabled={isLoading}
      className="flex-1 min-h-[60px] max-h-[200px]"
    />
    <Button
      type="submit"
      disabled={!input.trim() || isLoading}
    >
      {isLoading ? <Loader2 className="animate-spin" /> : <Send />}
    </Button>
  </div>
  <div className="flex justify-between mt-2 text-sm text-muted">
    <span>{tokenCount}/4000 tokens</span>
    {isLoading && (
      <button type="button" onClick={stop}>
        Stop generating
      </button>
    )}
  </div>
</form>
```

### Keyboard Shortcuts
- **Enter:** Submit message
- **Shift + Enter:** New line
- **Ctrl/Cmd + K:** Clear input
- **Esc:** Stop streaming (if active)

---

## RECOMMENDED COMPONENT STRUCTURE

```
frontend/src/components/chat/
├── ChatContainer.tsx          # Main wrapper
├── MessageList.tsx            # Scrollable message area
├── Message.tsx                # Individual message (user/AI)
├── StreamingText.tsx          # Character-by-character animation
├── TypingIndicator.tsx        # Animated dots
├── CitationPill.tsx           # [1] inline citation
├── CitationHoverCard.tsx      # Hover preview
├── SourceList.tsx             # List of sources at message end
├── SourceCard.tsx             # Individual source display
├── ChatInput.tsx              # Input form with submit
└── AutoScrollManager.tsx      # Hook/component for scroll logic
```

---

## KEY LIBRARIES & TOOLS

### Recommended Stack
- **Chat Logic:** `ai` package (Vercel AI SDK) - useChat hook
- **UI Components:** shadcn/ui + shadcn-chatbot-kit
- **Streaming:** Server-Sent Events (SSE) or WebSocket
- **Markdown:** `react-markdown` + `remark-gfm`
- **Syntax Highlighting:** `highlight.js` or `prism-react-renderer`
- **Citations:** Custom component with Radix UI Popover

### shadcn-chatbot-kit Features
- Pre-built chat components with animations
- Auto-scrolling message areas
- File attachment handling
- Dark/light mode theming
- Markdown + syntax highlighting
- Message actions (copy, rate, regenerate)

---

## PERFORMANCE BEST PRACTICES

1. **Virtualization:** Use react-window for 100+ messages
2. **Memoization:** Wrap Message components with React.memo()
3. **Debouncing:** Debounce scroll handlers (100-150ms)
4. **Lazy Loading:** Load older messages on scroll to top
5. **Code Splitting:** Dynamic import heavy components (markdown renderer)

---

## ACCESSIBILITY CONSIDERATIONS

- Use semantic HTML (`<article>`, `<section>`)
- ARIA labels for screen readers (`role="log"` for message list)
- Keyboard navigation (Tab through messages, Enter to expand citations)
- Focus management (return focus to input after submit)
- Announce new messages to screen readers (`aria-live="polite"`)

---

## REFERENCES

- Vercel AI SDK: https://ai-sdk.dev/
- shadcn-chatbot-kit: https://shadcn-chatbot-kit.vercel.app/
- AI UX Patterns (Citations): https://www.shapeof.ai/patterns/citations
- Smooth Text Streaming: https://upstash.com/blog/smooth-streaming
- Chat UI Best Practices (2025): https://bricxlabs.com/blogs/message-screen-ui-deisgn
