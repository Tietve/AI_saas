const fs = require('fs');
const path = require('path');

async function testOCR() {
  console.log('Testing OCR directly...');

  try {
    // Test 1: Can we load canvas?
    console.log('\n1. Testing canvas...');
    const { createCanvas } = require('canvas');
    const canvas = createCanvas(100, 100);
    console.log('✓ Canvas loaded successfully');

    // Test 2: Can we load pdfjs?
    console.log('\n2. Testing pdfjs...');
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');

    // Configure pdfjs to use node-canvas
    const { Image } = require('canvas');
    const { pathToFileURL } = require('url');
    const workerPath = path.join(__dirname, 'node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs');
    pdfjsLib.GlobalWorkerOptions.workerSrc = pathToFileURL(workerPath).href;
    global.Image = Image;

    console.log('✓ PDF.js loaded successfully');

    // Test 3: Can we read PDF?
    console.log('\n3. Testing PDF read...');
    const pdfPath = path.join(__dirname, 'public', 'uploads', '1759318212269-f0yks9.pdf');

    if (!fs.existsSync(pdfPath)) {
      console.log('✗ PDF file not found at:', pdfPath);
      return;
    }

    const pdfData = new Uint8Array(fs.readFileSync(pdfPath));
    console.log('✓ PDF file read:', pdfData.length, 'bytes');

    // Test 4: Can we load PDF document?
    console.log('\n4. Testing PDF load...');
    const loadingTask = pdfjsLib.getDocument({ data: pdfData });
    const pdfDoc = await loadingTask.promise;
    console.log('✓ PDF loaded, pages:', pdfDoc.numPages);

    // Test 5: Can we render first page?
    console.log('\n5. Testing page render...');
    const page = await pdfDoc.getPage(1);
    const viewport = page.getViewport({ scale: 1.0 });
    console.log('✓ Page loaded, size:', viewport.width, 'x', viewport.height);

    const renderCanvas = createCanvas(viewport.width, viewport.height);
    const context = renderCanvas.getContext('2d');

    await page.render({
      canvasContext: context,
      viewport: viewport
    }).promise;

    console.log('✓ Page rendered to canvas');

    // Test 6: Can we convert to base64?
    console.log('\n6. Testing image conversion...');
    const base64 = renderCanvas.toDataURL('image/png');
    console.log('✓ Converted to base64, length:', base64.length);

    console.log('\n✓ All tests passed! OCR should work.');

  } catch (error) {
    console.error('\n✗ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testOCR();
