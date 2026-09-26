#!/usr/bin/env python3
import gspread
from google.oauth2.service_account import Credentials
from googleapiclient.discovery import build
import json
import os
import time

SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]

def conectar_sheets_api():
    try:
        spreadsheet_id = os.environ.get('SPREADSHEET_ID')
        sa_json = json.loads(os.environ.get('GOOGLE_CREDENTIALS'))
        creds = Credentials.from_service_account_info(sa_json, scopes=SCOPES)
        service = build('sheets', 'v4', credentials=creds)
        return service, spreadsheet_id
    except Exception as e:
        print(f"Erro conexão: {e}")
        return None, None

def aplicar_formatacao():
    service, spreadsheet_id = conectar_sheets_api()
    if not service:
        return

    try:
        sheet_metadata = service.spreadsheets().get(spreadsheetId=spreadsheet_id).execute()
        sheets = sheet_metadata.get('sheets', [])

        acoes_sheet_id = None
        for sheet in sheets:
            if sheet['properties']['title'] == 'Acoes':
                acoes_sheet_id = sheet['properties']['sheetId']
                break

        if acoes_sheet_id is None:
            print("❌ Aba 'Acoes' não encontrada")
            return

        print(f"✅ Aba 'Acoes' encontrada")
        print(f"\n📋 Aplicando formatação condicional em Y, Z, AA...")

        # Remover formatações antigas
        print(f"   Removendo formatações antigas...")
        requests_delete = []
        for i in range(100):
            requests_delete.append({
                "deleteConditionalFormatRule": {
                    "sheetId": acoes_sheet_id,
                    "index": i
                }
            })

        body = {'requests': requests_delete}
        try:
            service.spreadsheets().batchUpdate(
                spreadsheetId=spreadsheet_id,
                body=body
            ).execute()
            print(f"   ✅ Formatações antigas removidas")
        except:
            pass

        time.sleep(1)

        # Aplicar nova formatação
        requests_add = []

        # Colunas Y, Z, AA = 24, 25, 26 (0-indexed)
        cols = [
            (24, 'Y', '7 dias'),
            (25, 'Z', '30 dias'),
            (26, 'AA', '122 dias')
        ]

        for col_idx, col_name, periodo in cols:
            # Verde quando "Subindo"
            requests_add.append({
                "addConditionalFormatRule": {
                    "rule": {
                        "ranges": [{
                            "sheetId": acoes_sheet_id,
                            "startRowIndex": 1,
                            "endRowIndex": 265,
                            "startColumnIndex": col_idx,
                            "endColumnIndex": col_idx + 1
                        }],
                        "booleanRule": {
                            "condition": {
                                "type": "CUSTOM_FORMULA",
                                "values": [{"userEnteredValue": f"={col_name}2=\"Subindo\""}]
                            },
                            "format": {
                                "backgroundColor": {
                                    "red": 0.0,
                                    "green": 1.0,
                                    "blue": 0.0,
                                    "alpha": 0.3
                                }
                            }
                        }
                    }
                }
            })

            # Vermelho quando "Caindo"
            requests_add.append({
                "addConditionalFormatRule": {
                    "rule": {
                        "ranges": [{
                            "sheetId": acoes_sheet_id,
                            "startRowIndex": 1,
                            "endRowIndex": 265,
                            "startColumnIndex": col_idx,
                            "endColumnIndex": col_idx + 1
                        }],
                        "booleanRule": {
                            "condition": {
                                "type": "CUSTOM_FORMULA",
                                "values": [{"userEnteredValue": f"={col_name}2=\"Caindo\""}]
                            },
                            "format": {
                                "backgroundColor": {
                                    "red": 1.0,
                                    "green": 0.0,
                                    "blue": 0.0,
                                    "alpha": 0.3
                                }
                            }
                        }
                    }
                }
            })

        # Aplicar em batches
        batch_size = 6
        for i in range(0, len(requests_add), batch_size):
            batch = requests_add[i:i+batch_size]
            body = {'requests': batch}
            service.spreadsheets().batchUpdate(
                spreadsheetId=spreadsheet_id,
                body=body
            ).execute()
            print(f"   ✅ Batch {i//batch_size + 1}: Formatação aplicada")
            time.sleep(1)

        print(f"\n✅ Concluído!")
        print(f"   Colunas: Y (7 dias), Z (30 dias), AA (122 dias)")
        print(f"   Verde = Subindo ✅")
        print(f"   Vermelho = Caindo ❌")

    except Exception as e:
        print(f"❌ Erro: {e}")

if __name__ == "__main__":
    aplicar_formatacao()
