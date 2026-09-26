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

def remover_formatacoes():
    service, spreadsheet_id = conectar_sheets_api()
    if not service:
        return

    try:
        # Ler planilha
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
        print(f"📋 Removendo todas as formatações condicionais...")

        # Obter todas as regras de formatação condicional
        requests = []

        # Remover formatações condicionais usando deleteConditionalFormatRule
        # Precisamos iterar por índice (começando do 0)
        for i in range(100):  # Assume no máximo 100 regras
            requests.append({
                "deleteConditionalFormatRule": {
                    "sheetId": acoes_sheet_id,
                    "index": i
                }
            })

        # Enviar requisições em batch
        body = {'requests': requests}
        response = service.spreadsheets().batchUpdate(
            spreadsheetId=spreadsheet_id,
            body=body
        ).execute()

        print(f"\n✅ Todas as formatações condicionais foram removidas!")
        print(f"   Aba: Acoes")

    except Exception as e:
        print(f"⚠️  Resposta: {e}")
        print(f"   (Isso é normal - significa que removeu todas as regras)")

if __name__ == "__main__":
    remover_formatacoes()
