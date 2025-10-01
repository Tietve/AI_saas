const { jsPDF } = require('jspdf');

// Create a PDF with actual text
const doc = new jsPDF();

doc.setFontSize(16);
doc.text('Test PDF Document', 20, 20);
doc.setFontSize(12);
doc.text('This is a test PDF file with actual text content.', 20, 40);
doc.text('', 20, 50);
doc.text('AI should be able to read this text.', 20, 60);
doc.text('This PDF was generated using jsPDF library.', 20, 70);
doc.text('', 20, 80);
doc.text('Some Vietnamese text: Xin chào! Đây là văn bản tiếng Việt.', 20, 90);
doc.text('Numbers: 1234567890', 20, 100);
doc.text('Special characters: !@#$%^&*()', 20, 110);

doc.save('test-readable.pdf');
console.log('✓ Created test-readable.pdf');
