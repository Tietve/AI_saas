const fs = require('fs');
const FormData = require('form-data');
const fetch = require('node-fetch');

async function testUpload() {
  const form = new FormData();

  // You need to have a test PDF file
  const testFile = fs.createReadStream('test-upload.txt');
  form.append('files', testFile);

  try {
    const res = await fetch('http://localhost:3000/api/upload', {
      method: 'POST',
      body: form
    });

    const data = await res.json();
    console.log('Upload Response:', JSON.stringify(data, null, 2));

    if (data.attachments && data.attachments[0]) {
      const att = data.attachments[0];
      console.log('\n=== Attachment Details ===');
      console.log('ID:', att.id);
      console.log('Name:', att.name);
      console.log('Type:', att.type);
      console.log('Meta:', JSON.stringify(att.meta, null, 2));
      console.log('Has extractedText:', 'extractedText' in (att.meta || {}));
      if (att.meta?.extractedText) {
        console.log('Extracted text preview:', att.meta.extractedText.substring(0, 200));
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testUpload();
