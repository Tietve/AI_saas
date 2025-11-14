# PDF Text Extraction Libraries for Node.js - Research Report

**Date:** 2025-11-13 | **Focus:** pdf-parse vs pdfjs-dist vs pdf2json

---

## 1. Library Comparison Matrix

| Aspect | pdf-parse | pdfjs-dist | pdf2json |
|--------|-----------|-----------|----------|
| **Purpose** | Text extraction (dedicated) | Rendering + extraction | Structured JSON parsing |
| **Learning Curve** | Low | High | Medium-High |
| **Weekly Downloads** | ~1.2M | ~5M | ~400K |
| **Dependencies** | Minimal | Heavy | Zero (v3.1.6+) |
| **Best For** | Simple text extraction | Complex/unpredictable PDFs | Detailed layout preservation |
| **Use Case** | Search indexing, QA | Browser rendering, precision | Coordinate-based data |

---

## 2. Performance & Benchmarks

### pdf-parse
- **Speed:** Fast for straightforward PDFs
- **Throughput:** ~40-60 PDFs/minute (estimated)
- **Limitation:** Struggles with complex layouts (multi-column, tables)
- **Stability:** Addresses pdf2json's legacy memory issues

### pdf2json
- **Speed:** Processes 261 PDFs in <40 seconds
- **Structure:** Preserves font details, coordinates, styling
- **Trade-off:** Slower on very large PDFs due to detailed parsing

### pdfjs-dist
- **Speed:** Variable (rendering overhead)
- **Precision:** Battle-tested for unpredictable formats
- **Trade-off:** Higher CPU usage than pdf-parse

---

## 3. Text Extraction Quality

### pdf-parse (Best for Raw Text)
```javascript
const pdf = require('pdf-parse');
const fs = require('fs');

const pdfBuffer = fs.readFileSync('document.pdf');
const data = await pdf(pdfBuffer);
console.log(data.text); // Clean text output
```
- ✅ Clean text extraction
- ✅ Metadata retrieval (title, author, pages)
- ❌ No positional/structural information
- ❌ Struggles with: scanned PDFs, complex layouts, OCR

### pdfjs-dist (Best for Precision)
```javascript
const pdfjsLib = require('pdfjs-dist');

const doc = await pdfjsLib.getDocument({ data: pdfBuffer }).promise;
const page = await doc.getPage(1);
const textContent = await page.getTextContent();
const text = textContent.items.map(item => item.str).join('');
```
- ✅ Page-by-page control
- ✅ Positional data (x, y coordinates)
- ✅ Handles complex PDFs reliably
- ❌ Steeper learning curve
- ❌ Higher memory usage

### pdf2json (Best for Structured Data)
```javascript
const PDFParser = require('pdf2json');
const pdfParser = new PDFParser(null, true);

pdfParser.on('pdfParser_dataReady', () => {
  console.log(pdfParser.getRawTextContent());
});
```
- ✅ JSON structure with coordinates
- ✅ Font/styling details
- ✅ Zero dependencies
- ❌ Complex output format

---

## 4. Handling Different PDF Formats

### Text-Based PDFs
**All libraries work well:**
- pdf-parse: Recommended (simplest, fastest)
- pdfjs-dist: Reliable (if complexity needed)
- pdf2json: Good (if coordinates required)

### Scanned PDFs (Images)
**All fail without OCR:**
- pdf-parse: ❌ Returns empty/gibberish
- pdfjs-dist: ❌ Returns empty/gibberish
- pdf2json: ❌ Returns empty/gibberish

**Solution Strategy:**
1. Try extraction (expect empty output)
2. If `text.length < threshold`: Trigger OCR
3. Use external OCR: Tesseract, Google Vision, or Nutrient API

**Recommended OCR Libraries:**
- `tesseract.js` - Client-side OCR
- `@google-cloud/vision` - Google Cloud OCR
- Nutrient/ConvertAPI - Managed OCR services

---

## 5. Memory Usage & Optimization

### pdf-parse (Most Efficient)
- **Memory:** ~50-100MB per typical PDF
- **Large files:** Can handle 100+ MB with care
- **Optimization:** Call `destroy()` after processing

```javascript
// Good practice
const data = await pdf(buffer);
// Use data
parser.destroy(); // Free memory
```

### pdfjs-dist (High Memory)
- **Memory:** 500MB-1.5GB for large/complex PDFs
- **Issue:** Memory doesn't always decrease after destroy()
- **Optimization Tips:**
  - Set `disableAutoFetch: true`
  - Set `rangeChunkSize: 524288` (65KB chunks)
  - Set `disableStream: false` for streaming mode
  - Process one page at a time
  - Call `loadingTask.destroy()` explicitly

```javascript
// Optimized pdfjs-dist
const doc = await pdfjsLib.getDocument({
  data: buffer,
  disableAutoFetch: true,
  disableStream: false,
  rangeChunkSize: 524288
}).promise;

for (let page = 1; page <= doc.numPages; page++) {
  const p = await doc.getPage(page);
  const text = await p.getTextContent();
  // Process & clear
  p.cleanup();
}
doc.destroy();
```

### pdf2json (Moderate Memory)
- **Memory:** 100-300MB per PDF
- **Issue:** Can exhaust memory on 26MB+ files
- **Optimization:** Process in chunks if possible

### Black & White Image Optimization
- **Impact:** 11x memory reduction (7800MB → 700MB)
- Use 1bpp instead of 32bpp RGBA for B&W content

---

## 6. Error Handling for Corrupted PDFs

### Try-Catch Pattern
```javascript
const pdf = require('pdf-parse');
const fs = require('fs');

async function safePdfParse(filePath) {
  try {
    const buffer = fs.readFileSync(filePath);
    const data = await pdf(buffer);

    // Validate output
    if (!data.text || data.text.trim().length === 0) {
      throw new Error('PDF extracted no text (may be scanned/encrypted)');
    }

    return data;
  } catch (error) {
    if (error.message.includes('Invalid PDF')) {
      console.error('Corrupted PDF file detected');
    } else if (error.message.includes('password')) {
      console.error('PDF is password-protected');
    }
    throw error;
  }
}
```

### Common Error Types
| Error | Cause | Recovery |
|-------|-------|----------|
| `InvalidPDFException` | Malformed file | Validate with header check |
| `Password required` | Encrypted PDF | Skip or use password service |
| `Empty text` | Scanned/image PDF | Trigger OCR pipeline |
| `Memory exhausted` | File too large | Use streaming or split |
| `Timeout` | Slow processing | Add timeout wrapper |

### Validation Approach
```javascript
// Pre-check PDF validity
function isValidPdf(buffer) {
  const header = buffer.toString('utf8', 0, 4);
  return header === '%PDF';
}

// Timeout wrapper for safety
async function pdfParseWithTimeout(buffer, timeoutMs = 30000) {
  return Promise.race([
    pdf(buffer),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('PDF parsing timeout')), timeoutMs)
    )
  ]);
}
```

---

## 7. Recommendations for PDF QA System

### Choose pdf-parse IF:
- ✅ Need simple text extraction for content validation
- ✅ Focus on text-based PDFs
- ✅ Need minimal dependencies (serverless friendly)
- ✅ Want best performance for typical documents
- ✅ Building search/QA indexing system

### Choose pdfjs-dist IF:
- ✅ Need positional/structural information
- ✅ Handle unpredictable PDF formats
- ✅ Complex layouts (tables, multi-column)
- ✅ Can accept higher memory usage

### Hybrid Approach (Recommended for Production):
```javascript
// 1. Try fast extraction with pdf-parse
// 2. If empty/corrupted → fallback to pdfjs-dist
// 3. If still empty → trigger OCR queue
// 4. Cache results to avoid re-parsing

const cache = new Map();

async function extractPdfText(filePath) {
  const cacheKey = `${filePath}_${Date.now()}`;

  if (cache.has(filePath)) return cache.get(filePath);

  try {
    // Fast path
    const data = await pdf(fs.readFileSync(filePath));
    if (data.text.trim().length > 0) {
      cache.set(filePath, data.text);
      return data.text;
    }
  } catch (e) {
    console.warn('pdf-parse failed, trying pdfjs-dist');
  }

  try {
    // Fallback to precision parser
    const data = await extractWithPdfJs(filePath);
    if (data.trim().length > 0) {
      cache.set(filePath, data);
      return data;
    }
  } catch (e) {
    console.warn('Text extraction failed, marking for OCR');
  }

  // Queue for OCR if needed
  await queueForOcr(filePath);
  return null;
}
```

---

## 8. Summary Table

| Metric | Winner | Why |
|--------|--------|-----|
| **Speed** | pdf-parse | Fastest for text extraction |
| **Memory** | pdf-parse | Lowest footprint |
| **Quality** | pdfjs-dist | Handles complex formats |
| **Precision** | pdf2json | Preserves structure |
| **Simplicity** | pdf-parse | Minimal setup |
| **Production Ready** | pdf-parse | Stable, no legacy issues |

---

## Resources

- [pdf-parse NPM](https://www.npmjs.com/package/pdf-parse)
- [pdfjs-dist GitHub](https://github.com/mozilla/pdf.js)
- [pdf2json GitHub](https://github.com/modesty/pdf2json)
- [Tesseract.js OCR](https://github.com/naptha/tesseract.js)
