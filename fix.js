const fs = require('fs');
const file = 'app/(dashboard)/csr/leads/[id]/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const head1 = `<<<<<<< HEAD
  const isEmailSent = !!lead?.intake_email_sent;
  const isSubmitted = !!lead?.form_submitted_at;
  const isAccepted = lead?.status === 'accepted';

  /* ================= UNIFIED UI ================= */
  return (
    <div className="max-w-4xl mx-auto p-10 space-y-8">
=======`;

const block1Replace = `  const isEmailSent = !!lead?.intake_email_sent;
  const isSubmitted = !!lead?.form_submitted_at;
  const isAccepted = lead?.status === 'accepted';

  /* ================= UNIFIED UI ================= */
  return (
    <div className="p-4 sm:p-6 lg:p-10">
      <div className="max-w-4xl mx-auto space-y-8">`;

const block1End = ">>>>>>> 488c215eae7dd001613ddbb2ea660d727b8b5027\n      <div className=\"bg-white rounded-2xl shadow-xl border overflow-hidden\">";

const startIdx = content.indexOf(head1.split('\\n')[0]);
const endIdx = content.indexOf('      <div className="bg-white rounded-2xl shadow-xl border overflow-hidden">', startIdx);
if (startIdx !== -1 && endIdx !== -1) {
  content = content.substring(0, startIdx) + block1Replace + '\n' + content.substring(endIdx);
} else {
    console.log("Failed block 1");
}

let changed2 = true;
if (content.indexOf(`<<<<<<< HEAD\n\n      {/* VIEW SUBMITTED FORM MODAL */}`) !== -1) {
  content = content.replace(`<<<<<<< HEAD\n\n      {/* VIEW SUBMITTED FORM MODAL */}`, `\n      {/* VIEW SUBMITTED FORM MODAL */}`);
} else if (content.indexOf(`<<<<<<< HEAD\r\n\r\n      {/* VIEW SUBMITTED FORM MODAL */}`) !== -1) {
  content = content.replace(`<<<<<<< HEAD\r\n\r\n      {/* VIEW SUBMITTED FORM MODAL */}`, `\r\n      {/* VIEW SUBMITTED FORM MODAL */}`);
} else { changed2 = false; }

let changed3 = true;
if (content.indexOf(`=======\n      </div>\n>>>>>>> 488c215eae7dd001613ddbb2ea660d727b8b5027\n`) !== -1) {
  content = content.replace(`=======\n      </div>\n>>>>>>> 488c215eae7dd001613ddbb2ea660d727b8b5027\n`, `      </div>\n`);
} else if (content.indexOf(`=======\r\n      </div>\r\n>>>>>>> 488c215eae7dd001613ddbb2ea660d727b8b5027\r\n`) !== -1) {
  content = content.replace(`=======\r\n      </div>\r\n>>>>>>> 488c215eae7dd001613ddbb2ea660d727b8b5027\r\n`, `      </div>\r\n`);
} else { changed3 = false; }

fs.writeFileSync(file, content);
console.log("Done", !changed2 || !changed3 ? "but missed chunks" : "full");
