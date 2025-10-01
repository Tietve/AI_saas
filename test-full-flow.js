const fs = require('fs');

async function testFullFlow() {
  // Step 1: Upload file
  console.log('=== Step 1: Upload file ===');
  const FormData = require('form-data');
  const form = new FormData();
  form.append('files', fs.createReadStream('test-upload.txt'));

  const uploadRes = await fetch('http://localhost:3000/api/upload', {
    method: 'POST',
    body: form
  });

  const uploadData = await uploadRes.json();
  console.log('Upload response:', JSON.stringify(uploadData, null, 2));

  const attachment = uploadData.attachments[0];
  console.log('\nAttachment has extractedText:', 'extractedText' in (attachment.meta || {}));

  // Step 2: Send chat message with attachment
  console.log('\n=== Step 2: Send chat with attachment ===');

  const chatPayload = {
    conversationId: 'new',
    content: 'Tóm tắt file này cho tôi',
    model: 'gpt_4o_mini',
    attachments: [attachment]
  };

  console.log('Chat payload attachments:', JSON.stringify(chatPayload.attachments, null, 2));

  // Note: This will fail without auth, but we can see the request
  console.log('\nChat payload ready. Attachment meta keys:', Object.keys(attachment.meta || {}));
}

testFullFlow().catch(console.error);
