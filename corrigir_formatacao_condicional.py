#!/usr/bin/env python3
import gspread
from google.oauth2.service_account import Credentials
from googleapiclient.discovery import build
import json
import os

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

def aplicar_formatacao_condicional():
    service, spreadsheet_id = conectar_sheets_api()
    if not service:
        return

    try:
        # Ler planilha para pegar ID da aba Dados
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

        print(f"✅ Aba 'Acoes' encontrada (ID: {acoes_sheet_id})")
        print(f"📋 Aplicando formatação condicional em AC3:AC21...")
        print(f"   Regra: =Q3>7 (com ajuste automático por linha)")

        # Aplicar formatação condicional usando addConditionalFormatRule
        requests = [
            {
                "addConditionalFormatRule": {
                    "rule": {
                        "ranges": [
                            {
                                "sheetId": acoes_sheet_id,
                                "startRowIndex": 2,      # Linha 3 (0-indexed)
                                "endRowIndex": 21,       # Até linha 21
                                "startColumnIndex": 28,  # Coluna AC (0-indexed)
                                "endColumnIndex": 29     # AC é coluna 29
                            }
                        ],
                        "booleanRule": {
                            "condition": {
                                "type": "CUSTOM_FORMULA",
                                "values": [{"userEnteredValue": "=Q3>7"}]
                            },
                            "format": {
                                "backgroundColor": {
                                    "red": 0.0,
                                    "green": 1.0,
                                    "blue": 0.0,
                                    "alpha": 0.2
                                }
                            }
                        }
                    },
                    "index": 0
                }
            }
        ]

        body = {'requests': requests}
        response = service.spreadsheets().batchUpdate(
            spreadsheetId=spreadsheet_id,
            body=body
        ).execute()

        print(f"\n✅ Formatação condicional aplicada com sucesso!")
        print(f"   Aba: Acoes")
        print(f"   Intervalo: AC3:AC21")
        print(f"   Fórmula: =Q3>7 (ajusta automaticamente por linha)")
        print(f"   Formato: Fundo verde quando Q > 7")

    except Exception as e:
        print(f"❌ Erro ao aplicar formatação: {e}")

if __name__ == "__main__":
    aplicar_formatacao_condicional()
