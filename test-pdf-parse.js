const fs = require('fs');
const path = require('path');

async function testPdfParse() {
  console.log('Testing pdf-parse...');

  // Check if pdf-parse is installed
  try {
    const pdfParse = require('pdf-parse');
    console.log('✓ pdf-parse module loaded');

    // Try to parse a PDF
    const pdfPath = path.join(__dirname, 'public', 'uploads', '1759315404100-p53efk.pdf');

    if (!fs.existsSync(pdfPath)) {
      console.log('✗ PDF file not found at:', pdfPath);
      console.log('  Looking for any PDF in uploads...');

      const uploadsDir = path.join(__dirname, 'public', 'uploads');
      if (fs.existsSync(uploadsDir)) {
        const files = fs.readdirSync(uploadsDir);
        const pdfs = files.filter(f => f.endsWith('.pdf'));
        console.log('  Found PDFs:', pdfs);

        if (pdfs.length > 0) {
          const testPdf = path.join(uploadsDir, pdfs[0]);
          console.log('  Testing with:', pdfs[0]);
          const buffer = fs.readFileSync(testPdf);
          console.log('  PDF size:', buffer.length, 'bytes');

          try {
            const data = await pdfParse(buffer);
            console.log('✓ PDF parsed successfully!');
            console.log('  Pages:', data.numpages);
            console.log('  Text length:', data.text.length, 'chars');
            console.log('  First 200 chars:', data.text.substring(0, 200));
          } catch (parseError) {
            console.log('✗ PDF parse failed:', parseError.message);
            console.log('  Error stack:', parseError.stack);
          }
        }
      } else {
        console.log('✗ Uploads directory not found');
      }
      return;
    }

    const buffer = fs.readFileSync(pdfPath);
    console.log('✓ PDF file loaded, size:', buffer.length, 'bytes');

    const data = await pdfParse(buffer);
    console.log('✓ PDF parsed successfully!');
    console.log('  Pages:', data.numpages);
    console.log('  Text length:', data.text.length, 'chars');
    console.log('  Preview:', data.text.substring(0, 200));

  } catch (error) {
    console.log('✗ Error:', error.message);
    console.log('  Stack:', error.stack);
  }
}

testPdfParse();
