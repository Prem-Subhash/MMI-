import fs from 'fs';

async function testUpload() {
  const formData = new FormData();
  // Create a dummy text file buffer
  const fileContent = new Blob(['Hello World'], { type: 'application/pdf' });
  formData.append('file', fileContent, 'test.pdf');
  formData.append('intakeFormId', '0cea746f-1744-4010-9396-9d3349b9d73b');

  try {
    const res = await fetch('http://localhost:3000/api/upload-document', {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    console.log("Status:", res.status);
    console.log("Response:", data);
  } catch (e) {
    console.error("Error:", e);
  }
}

testUpload();
