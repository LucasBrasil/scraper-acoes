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

def parse_intervalos(intervalos_str):
    """Converte string de intervalos para lista de (start_row, end_row)"""
    intervalos = []

    for item in intervalos_str.strip().split('\n'):
        item = item.strip()
        if not item:
            continue

        # Remove "AC" e converte
        item = item.replace('AC', '').strip()

        if 'até' in item:
            parts = item.split('até')
            start = int(parts[0].strip())
            end = int(parts[1].strip())
            intervalos.append((start, end))
        elif 'e' in item:
            parts = item.split('e')
            for part in parts:
                num = int(part.strip())
                intervalos.append((num, num))
        else:
            num = int(item)
            intervalos.append((num, num))

    return intervalos

def remover_e_reaplicar():
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

        print(f"✅ Aba 'Acoes' encontrada (ID: {acoes_sheet_id})")
        print(f"📋 Removendo formatações antigas de AC39:AC229...")

        # Remover TODAS as formatações (deletando índice 0 repetidamente)
        print(f"   Removendo regras...")
        for _ in range(50):  # Tenta remover até 50 vezes
            try:
                requests = [{
                    "deleteConditionalFormatRule": {
                        "sheetId": acoes_sheet_id,
                        "index": 0
                    }
                }]
                body = {'requests': requests}
                service.spreadsheets().batchUpdate(
                    spreadsheetId=spreadsheet_id,
                    body=body
                ).execute()
                print(f"      ✅ Removida 1 regra (índice 0)")
            except:
                break  # Parou quando não há mais regras

        print(f"   ✅ Todas as formatações antigas removidas")

        # Agora reaplicar com a cor cinza-escuro CORRETA
        print(f"\n📋 Reaplicando com a cor cinza-escuro 2 (RGB 153,153,153)...")

        # Intervalos de AC3:AC37 (mantém)
        intervalos_3_37 = [(3, 37)]

        # Intervalos de AC39:AC229 (reaplica com cor correta)
        intervalos_39_229_text = """
AC39 até AC43
AC45
AC47 até AC54
AC56 até AC59
AC61 até AC72
AC74 até AC81
AC83 até AC87
AC89 até AC102
AC105 e AC106
AC107 até AC111
AC113 e AC114
AC116 até AC121
AC123 até AC129
AC131 até AC135
AC137 até AC141
AC143
AC145 até AC148
AC150 até AC155
AC157 até AC164
AC166 até AC169
AC171 até AC173
AC175 até AC183
AC185 até AC188
AC190 até AC192
AC194 até AC202
AC204 até AC208
AC210 até AC218
AC220
AC222
AC224 e AC225
AC226 e AC227
AC229
        """

        intervalos_39_229 = parse_intervalos(intervalos_39_229_text)

        # Combinar todos os intervalos
        todos_intervalos = intervalos_3_37 + intervalos_39_229

        requests = []
        total_linhas = 0

        for start_row, end_row in todos_intervalos:
            start_idx = start_row - 1
            end_idx = end_row
            total_linhas += (end_row - start_row + 1)

            requests.append({
                "addConditionalFormatRule": {
                    "rule": {
                        "ranges": [
                            {
                                "sheetId": acoes_sheet_id,
                                "startRowIndex": start_idx,
                                "endRowIndex": end_idx,
                                "startColumnIndex": 28,
                                "endColumnIndex": 29
                            }
                        ],
                        "booleanRule": {
                            "condition": {
                                "type": "CUSTOM_FORMULA",
                                "values": [{"userEnteredValue": f"=Q{start_row}>7"}]
                            },
                            "format": {
                                "backgroundColor": {
                                    "red": 0.6,
                                    "green": 0.6,
                                    "blue": 0.6,
                                    "alpha": 1.0
                                }
                            }
                        }
                    }
                }
            })

        # Aplicar em batches
        batch_size = 25
        for i in range(0, len(requests), batch_size):
            batch = requests[i:i+batch_size]
            body = {'requests': batch}
            service.spreadsheets().batchUpdate(
                spreadsheetId=spreadsheet_id,
                body=body
            ).execute()
            print(f"   ✅ Batch {i//batch_size + 1}: {len(batch)} regras reaplicadas")

        print(f"\n✅ Concluído!")
        print(f"   Aba: Acoes")
        print(f"   Total de linhas: {total_linhas}")
        print(f"   Cor: RGB (153, 153, 153) - Cinza-escuro 2")

    except Exception as e:
        print(f"Erro: {e}")

if __name__ == "__main__":
    remover_e_reaplicar()
