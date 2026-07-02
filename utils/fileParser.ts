import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export interface ParseResult {
    data: any[];
    error?: string;
}

/**
 * Normalizes date inputs from various spreadsheet and CSV formats into standard YYYY-MM-DD.
 * Handles:
 * - JS Date objects (accounting for UTC midnight values from spreadsheet parsers)
 * - Excel serial date numbers (e.g. 45291, 46022)
 * - Formatted date strings (YYYY-MM-DD, MM/DD/YYYY, DD/MM/YYYY, MM-DD-YYYY, DD-MM-YYYY, etc.)
 * - Alphanumeric formats (e.g. "15-Jan-26", "Jan 15, 2026")
 */
export const normalizeImportDate = (input: any): string | null => {
    if (input === null || input === undefined || input === '') {
        return null;
    }

    // 1. Handle JavaScript Date Objects
    if (input instanceof Date) {
        if (isNaN(input.getTime())) return null;
        // ExcelJS / SheetJS parse serial date numbers without time components into UTC midnight Date objects.
        // If hours is 0 (or < 12), use UTC methods to prevent timezone shifting in western hemispheres.
        const useUTC = input.getUTCHours() === 0 || input.getUTCHours() < 12;
        const yyyy = useUTC ? input.getUTCFullYear() : input.getFullYear();
        const mm = String((useUTC ? input.getUTCMonth() : input.getMonth()) + 1).padStart(2, '0');
        const dd = String(useUTC ? input.getUTCDate() : input.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    }

    // 2. Handle Excel Serial Date Numbers (e.g. 45291, 46022)
    if (typeof input === 'number' || (typeof input === 'string' && /^\d+(\.\d+)?$/.test(input.trim()))) {
        const serial = Number(input);
        // Ensure serial number is within a reasonable date range for insurance renewal policies (approx years 1954 to 2119)
        // This prevents 4-digit years like "2026" or policy numbers from being mistakenly treated as serial dates if passed in.
        if (!isNaN(serial) && serial >= 20000 && serial <= 80000) {
            // Excel epoch Jan 1, 1970 is serial day 25569.
            const utcMillis = (Math.floor(serial) - 25569) * 86400 * 1000;
            const dateObj = new Date(utcMillis);
            if (!isNaN(dateObj.getTime())) {
                const yyyy = dateObj.getUTCFullYear();
                const mm = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
                const dd = String(dateObj.getUTCDate()).padStart(2, '0');
                return `${yyyy}-${mm}-${dd}`;
            }
        }
    }

    // 3. Handle Formatted Date Strings
    const clean = String(input).trim().replace(/\uFEFF/g, '');
    if (!clean) return null;

    // Check already normalized YYYY-MM-DD or ISO timestamp starting with YYYY-MM-DD / YYYY/MM/DD / YYYY.MM.DD
    const isoMatch = clean.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
    if (isoMatch) {
        const y = Number(isoMatch[1]);
        const m = Number(isoMatch[2]);
        const d = Number(isoMatch[3]);
        if (y >= 1900 && y <= 2100 && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
            return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        }
    }

    // Check standard delimited date strings: MM/DD/YYYY, DD/MM/YYYY, MM-DD-YYYY, DD-MM-YYYY, M/D/YY, D/M/YY
    const delimitedMatch = clean.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/);
    if (delimitedMatch) {
        const p1 = delimitedMatch[1];
        const p2 = delimitedMatch[2];
        const p3 = delimitedMatch[3];

        let y = Number(p3);
        if (p3.length === 2) {
            y = (y > 50 ? 1900 : 2000) + y;
        }

        const num1 = Number(p1);
        const num2 = Number(p2);

        let m: number, d: number;
        if (num1 > 12 && num1 <= 31 && num2 >= 1 && num2 <= 12) {
            // Unambiguously DD/MM/YYYY
            d = num1;
            m = num2;
        } else if (num2 > 12 && num2 <= 31 && num1 >= 1 && num1 <= 12) {
            // Unambiguously MM/DD/YYYY
            m = num1;
            d = num2;
        } else {
            // Both num1 and num2 are <= 12. Fall back to separator behavior to maintain 100% legacy CSV compatibility:
            // '/' defaults to MM/DD/YYYY [m, d, y], '-' defaults to DD-MM-YYYY [d, m, y]
            if (clean.includes('-')) {
                d = num1;
                m = num2;
            } else {
                m = num1;
                d = num2;
            }
        }

        if (y >= 1900 && y <= 2100 && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
            return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        }
    }

    // 4. Fallback for alphanumeric Excel formats like "15-Jan-26", "Jan 15, 2026", "15 Jan 2026"
    const parsed = new Date(clean);
    if (!isNaN(parsed.getTime())) {
        const isUTCMidnight = parsed.getUTCHours() === 0 && parsed.getUTCMinutes() === 0 && parsed.getUTCSeconds() === 0;
        const yyyy = isUTCMidnight ? parsed.getUTCFullYear() : parsed.getFullYear();
        const mm = String((isUTCMidnight ? parsed.getUTCMonth() : parsed.getMonth()) + 1).padStart(2, '0');
        const dd = String(isUTCMidnight ? parsed.getUTCDate() : parsed.getDate()).padStart(2, '0');
        if (yyyy >= 1900 && yyyy <= 2100) {
            return `${yyyy}-${mm}-${dd}`;
        }
    }

    return null;
};

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
                    if (value instanceof Date || (typeof key === 'string' && (key.toLowerCase().includes('date') || key.toLowerCase().includes('expiration')))) {
                        const normDate = normalizeImportDate(value);
                        newRow[key] = normDate !== null ? normDate : (value !== null && value !== undefined ? String(value) : "");
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
