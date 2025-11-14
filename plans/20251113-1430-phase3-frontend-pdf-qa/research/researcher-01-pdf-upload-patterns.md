# Research Report: React PDF Upload UI Patterns

**Date:** 2025-11-13
**Researcher:** researcher-01
**Focus:** PDF upload with drag-drop, progress tracking, validation, and quota management

---

## Executive Summary

**Recommended Stack:**
- **react-dropzone** (v14+) - Industry standard, TypeScript-native, actively maintained
- **Axios** - Upload with progress tracking via `onUploadProgress`
- **FormData API** - Standard multipart/form-data handling
- **React useState/useCallback** - State management for upload lifecycle

**Key Finding:** react-fine-uploader discontinued in 2018. React-dropzone is the clear modern choice.

---

## 1. Library Comparison

### react-dropzone (RECOMMENDED)
- **Status:** Active (14.2.3, last update 2024)
- **TypeScript:** Full native support
- **Bundle Size:** ~20KB gzipped
- **Pros:**
  - Built for React, uses hooks (useDropzone)
  - Excellent TypeScript types out-of-the-box
  - Minimal API surface, easy to customize
  - PDF validation via accept prop
  - File rejections handling built-in
- **Cons:**
  - No built-in progress bars (need separate implementation)
  - No server upload logic (intentional design)

### Alternatives (Not Recommended)
- **react-fine-uploader:** Discontinued 2018, wrapper around non-React library
- **react-fileupload-progress:** Outdated (last update 2016)
- **Uppy:** Over-engineered for simple PDF uploads (200KB+)

---

## 2. Drag-and-Drop Implementation

### Basic TypeScript Pattern

```typescript
import React, { useCallback, useState } from 'react';
import { useDropzone, FileRejection, DropzoneOptions } from 'react-dropzone';

interface UploadedFile {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  id: string;
}

const PdfUploader: React.FC = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const MAX_FILES = 5;

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
    // Check quota
    if (files.length + acceptedFiles.length > MAX_FILES) {
      alert(`Maximum ${MAX_FILES} files allowed`);
      return;
    }

    // Add files to state
    const newFiles = acceptedFiles.map(file => ({
      file,
      progress: 0,
      status: 'pending' as const,
      id: `${file.name}-${Date.now()}`
    }));

    setFiles(prev => [...prev, ...newFiles]);
  }, [files.length]);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: MAX_FILES,
    disabled: files.length >= MAX_FILES
  });

  return (
    <div>
      <div
        {...getRootProps()}
        className={`dropzone ${isDragActive ? 'active' : ''}`}
      >
        <input {...getInputProps()} />
        <p>
          {isDragActive
            ? 'Drop PDF files here...'
            : 'Drag & drop PDFs or click to select'}
        </p>
        <p className="quota">{files.length} / {MAX_FILES} files</p>
      </div>

      {/* File rejections */}
      {fileRejections.length > 0 && (
        <div className="errors">
          {fileRejections.map(({ file, errors }) => (
            <div key={file.name}>
              {file.name}: {errors.map(e => e.message).join(', ')}
            </div>
          ))}
        </div>
      )}

      {/* File list */}
      <FileList files={files} />
    </div>
  );
};
```

### Key Props for react-dropzone

```typescript
interface DropzoneConfig {
  accept: Record<string, string[]>;  // MIME types
  maxFiles: number;                  // Total file limit
  maxSize: number;                   // Bytes per file (default: Infinity)
  multiple: boolean;                 // Allow multiple files
  disabled: boolean;                 // Disable dropzone
  onDrop: (accepted: File[], rejected: FileRejection[]) => void;
}
```

---

## 3. File Upload with Progress Tracking

### Axios Implementation

```typescript
import axios, { AxiosProgressEvent } from 'axios';

const uploadFile = async (
  file: File,
  onProgress: (progress: number) => void
): Promise<{ success: boolean; data?: any; error?: string }> => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await axios.post('/api/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}`
      },
      onUploadProgress: (progressEvent: AxiosProgressEvent) => {
        const progress = Math.round(
          (100 * progressEvent.loaded) / (progressEvent.total || 1)
        );
        onProgress(progress);
      }
    });

    return { success: true, data: response.data };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.message || 'Upload failed'
    };
  }
};
```

### Upload Manager Hook

```typescript
const useFileUpload = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);

  const uploadFiles = async (newFiles: File[]) => {
    // Add files to state
    const uploadFiles = newFiles.map(file => ({
      file,
      progress: 0,
      status: 'pending' as const,
      id: crypto.randomUUID()
    }));

    setFiles(prev => [...prev, ...uploadFiles]);

    // Upload each file
    for (const uploadFile of uploadFiles) {
      // Update status
      setFiles(prev => prev.map(f =>
        f.id === uploadFile.id
          ? { ...f, status: 'uploading' }
          : f
      ));

      // Upload
      const result = await uploadFile(
        uploadFile.file,
        (progress) => {
          setFiles(prev => prev.map(f =>
            f.id === uploadFile.id
              ? { ...f, progress }
              : f
          ));
        }
      );

      // Update final status
      setFiles(prev => prev.map(f =>
        f.id === uploadFile.id
          ? {
              ...f,
              status: result.success ? 'success' : 'error',
              progress: result.success ? 100 : f.progress
            }
          : f
      ));
    }
  };

  return { files, uploadFiles, setFiles };
};
```

---

## 4. File Validation Patterns

### Client-Side Validation

```typescript
interface ValidationRule {
  maxSize?: number;       // Bytes
  maxFiles?: number;
  allowedTypes?: string[]; // MIME types
}

const validateFiles = (
  files: File[],
  existingCount: number,
  rules: ValidationRule
): { valid: File[]; errors: string[] } => {
  const errors: string[] = [];
  const valid: File[] = [];

  // Check file count
  if (rules.maxFiles && existingCount + files.length > rules.maxFiles) {
    errors.push(`Maximum ${rules.maxFiles} files allowed`);
    return { valid: [], errors };
  }

  files.forEach(file => {
    // Check file type
    if (rules.allowedTypes && !rules.allowedTypes.includes(file.type)) {
      errors.push(`${file.name}: Only PDF files allowed`);
      return;
    }

    // Check file size
    if (rules.maxSize && file.size > rules.maxSize) {
      const sizeMB = (rules.maxSize / 1024 / 1024).toFixed(1);
      errors.push(`${file.name}: Max size ${sizeMB}MB exceeded`);
      return;
    }

    valid.push(file);
  });

  return { valid, errors };
};

// Usage
const { valid, errors } = validateFiles(selectedFiles, files.length, {
  maxFiles: 5,
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: ['application/pdf']
});
```

---

## 5. Quota Display Component

```typescript
interface QuotaDisplayProps {
  current: number;
  max: number;
  totalSize?: number;     // Bytes
  maxTotalSize?: number;  // Bytes
}

const QuotaDisplay: React.FC<QuotaDisplayProps> = ({
  current,
  max,
  totalSize,
  maxTotalSize
}) => {
  const percentage = (current / max) * 100;
  const isNearLimit = percentage >= 80;
  const isAtLimit = current >= max;

  return (
    <div className="quota-display">
      <div className="quota-bar">
        <div
          className={`quota-fill ${isNearLimit ? 'warning' : ''} ${isAtLimit ? 'full' : ''}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <div className="quota-text">
        <span className={isAtLimit ? 'at-limit' : ''}>
          {current} / {max} files
        </span>
        {totalSize && maxTotalSize && (
          <span className="size">
            {formatBytes(totalSize)} / {formatBytes(maxTotalSize)}
          </span>
        )}
      </div>
    </div>
  );
};

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};
```

---

## 6. Best Practices Summary

### User Experience
- Show visual feedback on drag hover (border color, background)
- Display file count quota prominently (X / 5 files)
- Show individual progress bars for each file
- Enable file removal before/after upload
- Display error messages clearly (validation, upload failures)

### Accessibility
- Use semantic HTML (button, input[type="file"])
- Add ARIA labels for screen readers
- Ensure keyboard navigation works (Tab, Enter)
- Provide text alternatives for visual indicators

### Performance
- Validate files client-side before upload
- Use FormData for efficient multipart uploads
- Implement upload queue (don't upload all simultaneously)
- Consider chunked uploads for large files (>50MB)

### Security
- Always validate on server-side (client validation can be bypassed)
- Check file content, not just extension (magic bytes)
- Set maximum file size on both client and server
- Sanitize filenames before storage

---

## 7. Recommended Folder Structure

```
components/
├── upload/
│   ├── PdfUploader.tsx          # Main component
│   ├── Dropzone.tsx              # Drag-drop area
│   ├── FileList.tsx              # Uploaded files list
│   ├── FileItem.tsx              # Individual file with progress
│   ├── QuotaDisplay.tsx          # Quota indicator
│   ├── useFileUpload.ts          # Upload logic hook
│   ├── upload.utils.ts           # Validation, formatting
│   ├── upload.types.ts           # TypeScript types
│   └── upload.styles.css         # Styles
```

---

## 8. Installation Commands

```bash
# Core dependencies
npm install react-dropzone axios

# TypeScript types (if not included)
npm install -D @types/react-dropzone

# Optional: UI components
npm install @radix-ui/react-progress  # Progress bar
npm install lucide-react               # Icons
```

---

## Conclusion

**Optimal Stack:** react-dropzone + Axios + React hooks provides a lightweight, TypeScript-friendly solution with full control over UI/UX. Avoid over-engineered solutions like Uppy unless dealing with chunked uploads or resumable uploads for very large files.

**Key Advantages:**
- 100% type-safe with TypeScript
- Small bundle size (~20KB)
- Easy customization
- Active maintenance
- Industry-standard approach

**Implementation Time:** 2-4 hours for complete component with all features (drag-drop, progress, validation, quota display).
