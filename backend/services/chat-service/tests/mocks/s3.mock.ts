/**
 * AWS S3 Client Mock
 */

export const mockS3Send = jest.fn().mockResolvedValue({});

export const createMockS3Client = () => ({
  send: mockS3Send,
});

export const mockPutObjectCommand = jest.fn();
export const mockDeleteObjectCommand = jest.fn();

// Mock AWS SDK modules
jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => createMockS3Client()),
  PutObjectCommand: mockPutObjectCommand,
  DeleteObjectCommand: mockDeleteObjectCommand,
}));
