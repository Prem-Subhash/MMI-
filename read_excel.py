import pandas as pd
import json
import traceback

try:
    file_path = "C:/Users/prems/Downloads/Personal Pipeline (1).xlsx"
    xl = pd.ExcelFile(file_path)
    result = {}
    for sheet_name in xl.sheet_names:
        df = xl.parse(sheet_name)
        df = df.where(pd.notnull(df), None) # Replace NaN with None
        result[sheet_name] = df.to_dict(orient='records')
    
    with open('excel_dump.json', 'w', encoding='utf-8') as f:
        json.dump(result, f, indent=2, default=str)
    print("Success")
except Exception as e:
    print("Error:", e)
    traceback.print_exc()
