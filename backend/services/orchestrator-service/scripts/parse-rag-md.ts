import * as fs from 'fs';
import * as path from 'path';

interface DocumentChunk {
  content: string;
  title: string;
  category: string;
  tags: string[];
  source: string;
  language: string;
}

/**
 * Parse RAG.md into smaller chunks for vector storage
 * Strategy: Split by domains (## DOMAIN X: ...) to keep related content together
 */
function parseRAGMarkdown(filePath: string): DocumentChunk[] {
  console.log(`📖 Reading ${filePath}...`);

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  const chunks: DocumentChunk[] = [];
  let currentChunk: string[] = [];
  let currentTitle = '';
  let currentDomain = 'Introduction';
  let chunkIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect domain headers (## DOMAIN X:)
    const domainMatch = line.match(/^##\s+DOMAIN\s+\d+:\s+(.+)$/);
    if (domainMatch) {
      // Save previous chunk
      if (currentChunk.length > 50) { // Minimum 50 lines per chunk
        chunks.push(createChunk(currentChunk, currentTitle, currentDomain, chunkIndex++));
      }

      // Start new chunk
      currentDomain = domainMatch[1].trim();
      currentTitle = currentDomain;
      currentChunk = [line];
      continue;
    }

    // Detect section headers (### Title)
    const sectionMatch = line.match(/^###\s+(.+)$/);
    if (sectionMatch) {
      // If chunk is getting large (>300 lines), split here
      if (currentChunk.length > 300) {
        chunks.push(createChunk(currentChunk, currentTitle, currentDomain, chunkIndex++));
        currentChunk = [];
      }

      currentTitle = `${currentDomain} - ${sectionMatch[1].trim()}`;
    }

    // Add line to current chunk
    currentChunk.push(line);

    // Also split on major section dividers (---)
    if (line.trim() === '---' && currentChunk.length > 200) {
      chunks.push(createChunk(currentChunk, currentTitle, currentDomain, chunkIndex++));
      currentChunk = [];
    }
  }

  // Save last chunk
  if (currentChunk.length > 50) {
    chunks.push(createChunk(currentChunk, currentTitle, currentDomain, chunkIndex++));
  }

  console.log(`✅ Parsed into ${chunks.length} chunks\n`);

  return chunks;
}

function createChunk(
  lines: string[],
  title: string,
  domain: string,
  index: number
): DocumentChunk {
  const content = lines.join('\n').trim();

  // Extract tags from content
  const tags = extractTags(content, domain);

  return {
    content,
    title: title || `${domain} - Part ${index + 1}`,
    category: domain,
    tags,
    source: 'RAG.md Knowledge Base',
    language: 'en',
  };
}

function extractTags(content: string, domain: string): string[] {
  const tags: Set<string> = new Set();

  // Add domain as tag
  tags.add(domain.toLowerCase().replace(/\s+/g, '-'));

  // Extract common technical terms
  const technicalTerms = [
    'prompt engineering',
    'chain-of-thought',
    'few-shot',
    'zero-shot',
    'context management',
    'role assignment',
    'output format',
    'json schema',
    'error handling',
    'meta-prompting',
    'instruction following',
    'clarity',
    'ambiguity',
    'multi-turn',
    'conversation',
    'tone',
    'style',
    'evaluation',
    'reasoning',
    'examples',
    'templates',
    'best practices',
    'anti-patterns',
    'gpt-4',
    'claude',
    'gemini',
  ];

  const lowerContent = content.toLowerCase();

  for (const term of technicalTerms) {
    if (lowerContent.includes(term)) {
      tags.add(term.replace(/\s+/g, '-'));
    }
  }

  // Limit to top 10 tags
  return Array.from(tags).slice(0, 10);
}

/**
 * Analyze chunk statistics
 */
function analyzeChunks(chunks: DocumentChunk[]): void {
  console.log('📊 Chunk Statistics:\n');

  const lengths = chunks.map(c => c.content.length);
  const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const minLength = Math.min(...lengths);
  const maxLength = Math.max(...lengths);

  console.log(`   Total chunks: ${chunks.length}`);
  console.log(`   Avg length: ${Math.round(avgLength)} characters`);
  console.log(`   Min length: ${minLength} characters`);
  console.log(`   Max length: ${maxLength} characters`);
  console.log(`   Estimated tokens: ~${Math.round(avgLength / 4)} per chunk\n`);

  // Domain distribution
  const domainCounts = new Map<string, number>();
  chunks.forEach(chunk => {
    const count = domainCounts.get(chunk.category) || 0;
    domainCounts.set(chunk.category, count + 1);
  });

  console.log('   Chunks per domain:');
  for (const [domain, count] of domainCounts.entries()) {
    console.log(`   - ${domain}: ${count} chunks`);
  }
  console.log('');
}

/**
 * Preview first few chunks
 */
function previewChunks(chunks: DocumentChunk[], count = 3): void {
  console.log(`🔍 Preview of first ${count} chunks:\n`);

  for (let i = 0; i < Math.min(count, chunks.length); i++) {
    const chunk = chunks[i];
    const preview = chunk.content.substring(0, 150).replace(/\n/g, ' ');

    console.log(`Chunk ${i + 1}:`);
    console.log(`   Title: ${chunk.title}`);
    console.log(`   Category: ${chunk.category}`);
    console.log(`   Tags: ${chunk.tags.slice(0, 5).join(', ')}`);
    console.log(`   Length: ${chunk.content.length} chars`);
    console.log(`   Preview: ${preview}...`);
    console.log('');
  }
}

/**
 * Main function
 */
async function main() {
  console.log('\n🚀 RAG.md Parser - Convert Knowledge Base to Vector Chunks\n');
  console.log('='repeat(60));
  console.log('');

  // Paths
  const ragMdPath = path.join(__dirname, '../../../RAG.md');
  const outputPath = path.join(__dirname, '../data/RAG_KNOWLEDGE_BASE.json');

  // Check if RAG.md exists
  if (!fs.existsSync(ragMdPath)) {
    console.error(`❌ RAG.md not found at: ${ragMdPath}`);
    console.error('   Please ensure the file exists in the project root.\n');
    process.exit(1);
  }

  // Parse
  const chunks = parseRAGMarkdown(ragMdPath);

  // Analyze
  analyzeChunks(chunks);

  // Preview
  previewChunks(chunks);

  // Create data directory if needed
  const dataDir = path.dirname(outputPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Save to JSON
  console.log(`💾 Saving to ${path.basename(outputPath)}...`);
  fs.writeFileSync(outputPath, JSON.stringify(chunks, null, 2), 'utf-8');
  console.log(`✅ Saved ${chunks.length} chunks\n`);

  // Instructions
  console.log('='repeat(60));
  console.log('\n📝 Next Steps:\n');
  console.log('1. Review the generated file:');
  console.log(`   notepad ${outputPath}`);
  console.log('');
  console.log('2. Upload to Pinecone:');
  console.log('   npm run seed:rag');
  console.log('   (or manually run: npx tsx scripts/seed-rag-knowledge.ts)');
  console.log('');
  console.log('3. Test RAG retrieval:');
  console.log('   npx tsx src/scripts/test-multi-turn-rag.ts');
  console.log('\n✅ Done!\n');

  process.exit(0);
}

// Run
main().catch((error) => {
  console.error('\n❌ Error:', error);
  process.exit(1);
});
