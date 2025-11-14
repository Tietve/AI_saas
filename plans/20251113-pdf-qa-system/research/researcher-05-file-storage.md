# PDF File Storage Research: AWS S3 vs Cloudflare R2

## Executive Summary
For PDF storage in a SaaS chat system, **Cloudflare R2 is recommended** for high-traffic scenarios (98-99% cost savings on egress), while **AWS S3** suits enterprise requirements with tiered storage options.

---

## 1. Pricing Comparison

### AWS S3 Standard Storage
| Item | Cost |
|------|------|
| Storage | $0.023/GB/month (~$23/TB) |
| Data Transfer (outbound) | $0.09/GB |
| PUT/COPY/POST operations | $0.005 per 1,000 requests |
| GET operations | $0.0004 per 1,000 requests |
| **Free tier** | 5GB storage, 20K GET, 2K PUT/month |

### Cloudflare R2
| Item | Cost |
|------|------|
| Storage | $0.015/GB/month (~$15/TB) |
| Data Transfer (outbound) | **$0/GB (FREE)** |
| READ operations | $0.36 per million |
| WRITE operations | $4.50 per million |
| **Free tier** | 10GB storage, 10M reads, 1M writes/month |

### Cost Scenarios (Monthly)
**Scenario 1: Media Platform (1TB stored, 10TB bandwidth/month)**
- AWS S3: ~$1,050 (storage + egress)
- **R2: ~$15** → 98% savings

**Scenario 2: Archive Storage (500TB, low-traffic)**
- AWS S3 Standard: ~$11,500
- AWS S3 Glacier: ~$2,000
- **R2: ~$7,500** (competitive with Glacier)

---

## 2. Node.js SDK Integration

### AWS S3 (SDK v3)

**Installation:**
```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

**S3 Client Setup:**
```typescript
import { S3Client } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});
```

### Cloudflare R2 (S3-Compatible API)

**Installation:**
```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

**R2 Client Setup:**
```typescript
import { S3Client } from '@aws-sdk/client-s3';

const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CF_ACCESS_KEY_ID,
    secretAccessKey: process.env.CF_SECRET_ACCESS_KEY,
  }
});
```

---

## 3. Signed URL Generation

### Download (GET) Presigned URL
```typescript
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

async function getSignedDownloadUrl(
  bucket: string,
  key: string,
  expiresIn: number = 3600
) {
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key
  });
  return getSignedUrl(s3Client, command, { expiresIn });
}

// Usage: 1-hour expiry (max 7 days with SDK)
const downloadUrl = await getSignedDownloadUrl('pdf-bucket', 'documents/file.pdf', 3600);
```

### Upload (PUT) Presigned URL
```typescript
import { PutObjectCommand } from '@aws-sdk/client-s3';

async function getSignedUploadUrl(
  bucket: string,
  key: string,
  contentType: string = 'application/pdf',
  expiresIn: number = 3600
) {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType
  });
  return getSignedUrl(s3Client, command, { expiresIn });
}

// Usage: Client uploads directly without exposing credentials
const uploadUrl = await getSignedUploadUrl('pdf-bucket', 'uploads/file.pdf');
```

---

## 4. Lifecycle Policies for Auto-Deletion

### AWS S3 Lifecycle Policy
```json
{
  "Rules": [
    {
      "Id": "DeleteTempPDFs",
      "Status": "Enabled",
      "Prefix": "temp/",
      "Expiration": {
        "Days": 7
      }
    },
    {
      "Id": "ArchiveOldPDFs",
      "Status": "Enabled",
      "Prefix": "documents/",
      "Transitions": [
        {
          "Days": 30,
          "StorageClass": "STANDARD_IA"
        },
        {
          "Days": 90,
          "StorageClass": "GLACIER"
        }
      ]
    }
  ]
}
```

### Cloudflare R2 Lifecycle Rules
```json
{
  "Rules": [
    {
      "ID": "DeleteExpiredPDFs",
      "Status": "Enabled",
      "Filter": {
        "Prefix": "temp/"
      },
      "Expiration": {
        "Days": 7
      }
    }
  ]
}
```

**Implementation (Node.js):**
```typescript
import { PutBucketLifecycleConfigurationCommand } from '@aws-sdk/client-s3';

await s3Client.send(new PutBucketLifecycleConfigurationCommand({
  Bucket: 'pdf-bucket',
  LifecycleConfiguration: {
    Rules: [
      {
        ID: 'DeleteTempPDFs',
        Status: 'Enabled',
        Prefix: 'temp/',
        Expiration: { Days: 7 }
      }
    ]
  }
}));
```

---

## 5. Presigned Upload URLs (Direct Client Uploads)

### Direct Browser Upload
```typescript
async function generateUploadForm(fileName: string) {
  const uploadUrl = await getSignedUploadUrl('pdf-bucket', `uploads/${fileName}`);

  return {
    url: uploadUrl,
    method: 'PUT',
    headers: {
      'Content-Type': 'application/pdf'
    }
  };
}
```

**Frontend (fetch):**
```javascript
const { url } = await fetch('/api/get-upload-url?filename=report.pdf').then(r => r.json());

await fetch(url, {
  method: 'PUT',
  body: fileInput.files[0],
  headers: { 'Content-Type': 'application/pdf' }
});
```

---

## 6. Recommendation Matrix

| Requirement | S3 | R2 |
|------------|----|----|
| **High egress/bandwidth** | ❌ | ✅ |
| **Low-cost storage** | ❌ | ✅ |
| **Tiered storage (Glacier)** | ✅ | ❌ |
| **Enterprise features** | ✅ | ⚠️ |
| **Global CDN integration** | ⚠️ | ✅ (via Cloudflare) |
| **S3 API compatibility** | ✅ | ✅ |
| **Free tier** | ✅ (5GB) | ✅ (10GB) |

---

## 7. Implementation Decision

**For my-saas-chat PDF QA system:**
- **Recommended:** Cloudflare R2
- **Reasoning:** Chat systems have high read/download volume (PDFs sent to users) → massive egress savings
- **Fallback:** AWS S3 if enterprise/compliance requirements emerge
- **Cost Impact:** 98% egress savings with R2 for typical usage patterns

---

## 8. Code Example: Complete PDF Upload Service

```typescript
// storage.service.ts
import { S3Client } from '@aws-sdk/client-s3';
import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

class PDFStorageService {
  private client: S3Client;
  private bucket: string;

  constructor(useR2: boolean = true) {
    this.bucket = process.env.PDF_BUCKET!;
    this.client = new S3Client({
      region: useR2 ? 'auto' : 'us-east-1',
      endpoint: useR2
        ? `https://${process.env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`
        : undefined,
      credentials: {
        accessKeyId: useR2 ? process.env.CF_ACCESS_KEY_ID! : process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: useR2 ? process.env.CF_SECRET_ACCESS_KEY! : process.env.AWS_SECRET_ACCESS_KEY!,
      }
    });
  }

  async getUploadUrl(fileName: string, userId: string): Promise<string> {
    const key = `uploads/${userId}/${Date.now()}-${fileName}`;
    const cmd = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: 'application/pdf'
    });
    return getSignedUrl(this.client, cmd, { expiresIn: 3600 });
  }

  async getDownloadUrl(key: string): Promise<string> {
    const cmd = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return getSignedUrl(this.client, cmd, { expiresIn: 7200 });
  }

  async deleteFile(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key })
    );
  }
}

export default new PDFStorageService();
```

---

## References
- [AWS S3 Pricing](https://aws.amazon.com/s3/pricing/)
- [Cloudflare R2 Pricing](https://developers.cloudflare.com/r2/)
- [AWS SDK v3 Presigned URLs](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)
- [S3/R2 Comparison Studies](https://www.vantage.sh/blog/cloudflare-r2-aws-s3-comparison)
