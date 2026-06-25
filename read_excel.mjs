import * as xlsx from 'xlsx';
import * as fs from 'fs';

try {
    const workbook = xlsx.readFile('C:/Users/prems/Downloads/Personal Pipeline (1).xlsx');
    const result = {};

    workbook.SheetNames.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName];
        result[sheetName] = xlsx.utils.sheet_to_json(sheet, { defval: null });
    });

    fs.writeFileSync('excel_dump.json', JSON.stringify(result, null, 2));
    console.log('Successfully extracted Excel data to excel_dump.json');
} catch (e) {
    console.error('Error reading Excel file:', e);
}
