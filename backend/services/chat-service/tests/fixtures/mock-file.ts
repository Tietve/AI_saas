/**
 * Mock file objects for testing
 */

export const createMockFile = (overrides: Partial<Express.Multer.File> = {}): Express.Multer.File => {
  return {
    fieldname: 'file',
    originalname: 'test-document.pdf',
    encoding: '7bit',
    mimetype: 'application/pdf',
    destination: '/tmp/uploads',
    filename: 'test-document-123.pdf',
    path: '/tmp/uploads/test-document-123.pdf',
    size: 1024 * 100, // 100 KB
    stream: {} as any,
    buffer: Buffer.from('mock pdf content'),
    ...overrides,
  };
};

export const createLargeFile = (): Express.Multer.File => {
  return createMockFile({
    size: 1024 * 1024 * 15, // 15 MB (over limit)
  });
};

export const createInvalidTypeFile = (): Express.Multer.File => {
  return createMockFile({
    mimetype: 'image/png',
    originalname: 'image.png',
  });
};

export const createValidPdfFile = (): Express.Multer.File => {
  return createMockFile({
    originalname: 'Research_Paper-2024.pdf',
    size: 1024 * 1024 * 5, // 5 MB
    mimetype: 'application/pdf',
  });
};
