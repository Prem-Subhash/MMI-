import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export interface ParseResult {
    data: any[];
    error?: string;
}

/**
 * Universal file parser that routes .csv files to PapaParse
 * and .xlsx/.xls files to SheetJS (XLSX).
 * Outputs a normalized array of objects matching PapaParse's standard output.
 */
export const parseImportFile = async (
    file: File,
    onComplete: (results: ParseResult) => void
) => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    const mimeType = file.type;

    const isCsv = extension === 'csv' || mimeType === 'text/csv' || mimeType === 'application/csv';
    const isExcel = extension === 'xlsx' || extension === 'xls' ||
        mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        mimeType === 'application/vnd.ms-excel';

    if (!isCsv && !isExcel) {
        onComplete({ data: [], error: 'Unsupported file format. Please upload a .csv, .xlsx, or .xls file.' });
        return;
    }

    if (isCsv) {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                // Ensure all values are strings to match exact legacy CSV behavior
                const stringifiedData = results.data.map((row: any) => {
                    const newRow: any = {};
                    if (row && typeof row === 'object') {
                        Object.keys(row).forEach(key => {
                            newRow[key] = typeof row[key] === 'string' ? row[key] : String(row[key] || '');
                        });
                    }
                    return newRow;
                });
                onComplete({ data: stringifiedData });
            },
            error: (error) => {
                onComplete({ data: [], error: error.message });
            }
        });
    } else {
        // Excel processing
        try {
            const arrayBuffer = await file.arrayBuffer();
            // cellDates: true parses serial date numbers into JS Date objects
            const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];

            // defval: "" ensures missing columns don't result in missing keys
            const rawData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

            // Normalize everything to strings to perfectly match PapaParse outputs
            const formattedData = rawData.map((row: any) => {
                const newRow: any = {};
                for (const [key, value] of Object.entries(row)) {
                    if (value instanceof Date) {
                        // Format JS Date into YYYY-MM-DD
                        const yyyy = value.getFullYear();
                        const mm = String(value.getMonth() + 1).padStart(2, '0');
                        const dd = String(value.getDate()).padStart(2, '0');
                        newRow[key] = `${yyyy}-${mm}-${dd}`;
                    } else if (value === null || value === undefined) {
                        newRow[key] = "";
                    } else {
                        newRow[key] = typeof value === 'string' ? value : String(value);
                    }
                }
                return newRow;
            });

            onComplete({ data: formattedData });
        } catch (err: any) {
            onComplete({ data: [], error: err.message || 'Failed to parse Excel file.' });
        }
    }
};
