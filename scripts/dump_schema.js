const fs = require('fs');
const spec = JSON.parse(fs.readFileSync('openapi_service.json', 'utf8'));

const tables = [
    'clients', 'csrs', 'profiles', 'temp_leads_basics', 'temp_intake_forms',
    'client_insurance_details', 'pipelines', 'pipeline_stages', 'email_templates',
    'email_logs', 'uploaded_documents', 'form_templates'
];

const result = {};

if (spec.definitions) {
    for (const table of tables) {
        if (spec.definitions[table]) {
            result[table] = {
                properties: spec.definitions[table].properties,
                description: spec.definitions[table].description || ''
            };
        } else {
            result[table] = "Not found in definitions";
        }
    }
} else {
    console.log("No definitions found in openapi_service.json");
}

fs.writeFileSync('schema_dump.json', JSON.stringify(result, null, 2));
console.log("Schema dumped to schema_dump.json");
