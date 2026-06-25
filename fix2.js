const fs = require('fs');
const file = 'app/(dashboard)/csr/leads/[id]/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /<<<<<<< HEAD[\s\S]*?=======\r?\n([\s\S]*?)>>>>>>> 488c215eae7dd001613ddbb2ea660d727b8b5027\r?\n/;
const match = content.match(regex);
if (match) {
  content = content.replace(regex, `  const isEmailSent = !!lead?.intake_email_sent;
  const isSubmitted = !!lead?.form_submitted_at;
  const isAccepted = lead?.status === 'accepted';

  /* ================= UNIFIED UI ================= */
  return (
    <div className="p-4 sm:p-6 lg:p-10">
      <div className="max-w-4xl mx-auto space-y-8">
`);
  console.log('Successfully replaced Conflict 1');
} else {
  console.log('Regex did not match Conflict 1');
}

fs.writeFileSync(file, content);
