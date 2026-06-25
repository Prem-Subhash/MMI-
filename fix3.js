const fs = require('fs');
const file = 'app/(dashboard)/csr/leads/[id]/page.tsx';
let lines = fs.readFileSync(file, 'utf8').split('\n');

const out = [];
let i = 0;
while(i < lines.length) {
    if (lines[i].startsWith('<<<<<<< HEAD')) {
        // Start of conflict 1.
        if (lines[i+1].includes('const isEmailSent')) {
            // It's the first conflict.
            out.push("  const isEmailSent = !!lead?.intake_email_sent;");
            out.push("  const isSubmitted = !!lead?.form_submitted_at;");
            out.push("  const isAccepted = lead?.status === 'accepted';");
            out.push("");
            out.push("  /* ================= UNIFIED UI ================= */");
            out.push("  return (");
            out.push("    <div className=\"p-4 sm:p-6 lg:p-10\">");
            out.push("      <div className=\"max-w-4xl mx-auto space-y-8\">");
            
            // skip lines until after >>>>>>>
            while(i < lines.length && !lines[i].startsWith('>>>>>>> 488c')) {
                i++;
            }
        } 
        else {
            // It's the second conflict which was already partially removed?
            // Let's just skip it if it's there.
            i++;
        }
    } 
    else if (lines[i].startsWith('=======')) {
        // shouldn't happen if we skip properly
        i++;
    }
    else if (lines[i].startsWith('>>>>>>> 488c')) {
        // shouldn't happen either
        i++;
    }
    else {
        out.push(lines[i]);
    }
    i++;
}

fs.writeFileSync(file, out.join('\n'));
console.log("Done fixing file.");
