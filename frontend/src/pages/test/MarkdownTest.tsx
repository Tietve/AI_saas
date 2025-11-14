import { Box, Container, Typography, Paper } from '@mui/material';
import { MessageItem } from '@/features/chat/components/MessageItem';
import type { Message } from '@/shared/types';

const sampleMessages: Message[] = [
  {
    id: '0',
    role: 'assistant',
    timestamp: new Date(),
    content: `Great work! :fire: :rocket: Your code looks perfect :thumbsup: :sparkles:

Here are some tips:
- :check: Use meaningful variable names
- :warning: Don't forget error handling
- :star: Add comments for complex logic
- :shield: Always validate user input

Keep it up! :trophy: :heart:`,
  },
  {
    id: '1',
    role: 'assistant',
    timestamp: new Date(),
    content: `Here's a Python example:

\`\`\`python
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

# Calculate first 10 Fibonacci numbers
for i in range(10):
    print(f"F({i}) = {fibonacci(i)}")
\`\`\`

And here's some JavaScript:

\`\`\`javascript
const greet = (name) => {
  console.log(\`Hello, \${name}!\`);
};

greet('World');
\`\`\`
`,
  },
  {
    id: '2',
    role: 'assistant',
    timestamp: new Date(),
    content: `Inline math: The quadratic formula is $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$

Block equation:

$$
\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}
$$

Einstein's famous equation:

$$E = mc^2$$
`,
  },
  {
    id: '3',
    role: 'assistant',
    timestamp: new Date(),
    content: `## Programming Languages

| Language | Year | Type |
|----------|------|------|
| Python   | 1991 | Interpreted |
| JavaScript | 1995 | Interpreted |
| Rust     | 2010 | Compiled |

### Features:
- **Python**: Great for data science
- **JavaScript**: Runs everywhere
- **Rust**: Memory safe without GC

### Todo:
1. Learn syntax
2. Build projects
3. Master concepts
`,
  },
  {
    id: '4',
    role: 'assistant',
    timestamp: new Date(),
    content: `# Heading 1
## Heading 2
### Heading 3

**Bold text** and *italic text* and ***both***.

> This is a blockquote
> It can span multiple lines

Inline \`code\` looks like this.

Here's a [link to Google](https://google.com)

---

Horizontal rule above!
`,
  },
  {
    id: '5',
    role: 'assistant',
    timestamp: new Date(),
    content: `Matrix equation:

$$
\\begin{bmatrix}
a & b \\\\
c & d
\\end{bmatrix}
\\begin{bmatrix}
x \\\\
y
\\end{bmatrix}
=
\\begin{bmatrix}
ax + by \\\\
cx + dy
\\end{bmatrix}
$$

Summation: $\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}$

Limit: $\\lim_{x \\to \\infty} \\frac{1}{x} = 0$
`,
  },
  {
    id: '6',
    role: 'assistant',
    timestamp: new Date(),
    content: `Here's a long Python function that should be collapsible:

\`\`\`python
def merge_sort(arr):
    """
    Merge Sort algorithm implementation
    Time complexity: O(n log n)
    Space complexity: O(n)
    """
    if len(arr) <= 1:
        return arr

    # Divide the array into two halves
    mid = len(arr) // 2
    left_half = arr[:mid]
    right_half = arr[mid:]

    # Recursively sort both halves
    left_sorted = merge_sort(left_half)
    right_sorted = merge_sort(right_half)

    # Merge the sorted halves
    return merge(left_sorted, right_sorted)

def merge(left, right):
    """
    Merge two sorted arrays into one sorted array
    """
    result = []
    i = j = 0

    # Compare elements from left and right arrays
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            result.append(left[i])
            i += 1
        else:
            result.append(right[j])
            j += 1

    # Append remaining elements
    result.extend(left[i:])
    result.extend(right[j:])

    return result

# Example usage
numbers = [64, 34, 25, 12, 22, 11, 90, 88, 45, 50, 32, 19]
print(f"Original array: {numbers}")
sorted_numbers = merge_sort(numbers)
print(f"Sorted array: {sorted_numbers}")

# Time complexity analysis:
# - Best case: O(n log n)
# - Average case: O(n log n)
# - Worst case: O(n log n)
\`\`\`

This code block has over 20 lines, so it should automatically collapse!
`,
  },
  {
    id: '7',
    role: 'assistant',
    timestamp: new Date(),
    content: `Here's a shorter code block that should NOT collapse:

\`\`\`javascript
function greet(name) {
  return \`Hello, \${name}!\`;
}

console.log(greet('World'));
\`\`\`

This one only has 5 lines, so it stays expanded.
`,
  },
];

export function MarkdownTestPage() {
  const handleCopy = (content: string) => {
    console.log('Copied:', content);
  };

  const handleRegenerate = (id: string) => {
    console.log('Regenerate:', id);
  };

  const handleFeedback = (id: string, type: 'up' | 'down') => {
    console.log('Feedback:', id, type);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" gutterBottom sx={{ mb: 4, fontWeight: 600, textAlign: 'center' }}>
        Markdown & LaTeX Rendering Test with Token Counter
      </Typography>

      <Paper
        elevation={0}
        sx={{
          bgcolor: 'var(--bg-secondary, #f5f5f5)',
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        {sampleMessages.map((msg) => (
          <MessageItem
            key={msg.id}
            message={msg}
            onCopy={handleCopy}
            onRegenerate={handleRegenerate}
            onFeedback={handleFeedback}
          />
        ))}
      </Paper>

      <Paper
        elevation={2}
        sx={{
          p: 3,
          mt: 4,
          bgcolor: '#e8f5e9',
        }}
      >
        <Typography variant="h6" gutterBottom>
          ✅ Features Tested:
        </Typography>
        <ul>
          <li><strong>Syntax highlighting</strong> for code blocks (Python, JavaScript)</li>
          <li><strong>Inline and block LaTeX equations</strong> with KaTeX</li>
          <li><strong>Token counting</strong> - Real-time display in each message</li>
          <li><strong>Icon support</strong> - :icon_name: syntax with 100+ Lucide icons</li>
          <li><strong>Collapsible long code blocks</strong> - Auto-collapse code &gt;20 lines</li>
          <li><strong>Tables</strong> with borders (GFM style)</li>
          <li><strong>Lists</strong> (ordered and unordered)</li>
          <li><strong>Rich formatting</strong> - Bold, italic, combined</li>
          <li><strong>Blockquotes</strong></li>
          <li><strong>Links</strong></li>
          <li><strong>Horizontal rules</strong></li>
          <li><strong>Headings</strong> (H1-H6)</li>
          <li><strong>Inline code</strong></li>
          <li><strong>Message actions</strong> - Copy, Regenerate, Feedback</li>
        </ul>
      </Paper>
    </Container>
  );
}
