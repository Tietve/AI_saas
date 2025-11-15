/**
 * Service Mocks - PdfParser, Chunking, Embedding, VectorStore
 */

export const mockParsedPdf = {
  text: 'Sample PDF text content with multiple paragraphs.',
  pageCount: 5,
  metadata: {
    title: 'Test Document',
    author: 'Test Author',
    creationDate: new Date('2024-01-01'),
  },
};

export const mockChunks = [
  {
    content: 'First chunk of text content.',
    chunkIndex: 0,
    pageNumber: 1,
    tokens: 10,
  },
  {
    content: 'Second chunk of text content.',
    chunkIndex: 1,
    pageNumber: 1,
    tokens: 10,
  },
  {
    content: 'Third chunk of text content.',
    chunkIndex: 2,
    pageNumber: 2,
    tokens: 10,
  },
];

export const mockEmbeddings = {
  embeddings: [
    new Array(1536).fill(0.1),
    new Array(1536).fill(0.2),
    new Array(1536).fill(0.3),
  ],
  tokensUsed: 30,
};

// PdfParserService Mock
export class MockPdfParserService {
  parsePdf = jest.fn().mockResolvedValue(mockParsedPdf);
}

// ChunkingService Mock
export class MockChunkingService {
  chunkText = jest.fn().mockResolvedValue(mockChunks);
}

// EmbeddingService Mock
export class MockEmbeddingService {
  generateEmbeddings = jest.fn().mockResolvedValue(mockEmbeddings);
}

// VectorStoreService Mock
export class MockVectorStoreService {
  insertChunks = jest.fn().mockResolvedValue(undefined);
  getChunkCount = jest.fn().mockResolvedValue(10);
  searchSimilar = jest.fn().mockResolvedValue([]);
}
