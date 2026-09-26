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
        client = gspread.authorize(creds)
        return service, client, spreadsheet_id
    except Exception as e:
        print(f"Erro conexão: {e}")
        return None, None, None

def adicionar_tendencias_com_formatacao():
    service, client, spreadsheet_id = conectar_sheets_api()
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

        # Conectar com gspread para adicionar fórmulas
        ss = client.open_by_key(spreadsheet_id)
        ws = ss.worksheet('Acoes')

        # Buscar dados para saber até que linha tem tickers
        dados = ws.get_all_values()
        ultima_linha = len(dados)

        print(f"📋 Adicionando fórmulas de tendência...")
        print(f"   Total de linhas na aba: {ultima_linha}")

        # Fórmulas para cada coluna (Y, Z, AA)
        formulas = {
            'Y': '=IF(IFERROR(GOOGLEFINANCE(A{row},"price",TODAY())>GOOGLEFINANCE(A{row},"price",TODAY()-7),0)=1,"Subindo","Caindo")',
            'Z': '=IF(IFERROR(GOOGLEFINANCE(A{row},"price",TODAY())>GOOGLEFINANCE(A{row},"price",TODAY()-30),0)=1,"Subindo","Caindo")',
            'AA': '=IF(IFERROR(GOOGLEFINANCE(A{row},"price",TODAY())>GOOGLEFINANCE(A{row},"price",TODAY()-122),0)=1,"Subindo","Caindo")'
        }

        # Adicionar fórmulas (começando da linha 2, até ultima_linha)
        for row in range(2, ultima_linha + 1):
            try:
                # Verificar se tem ticker na linha
                if row <= len(dados) and dados[row - 1] and dados[row - 1][0]:
                    for col, formula_template in formulas.items():
                        formula = formula_template.replace('{row}', str(row))
                        ws.update(f'{col}{row}', formula)

                    if row % 20 == 0:
                        print(f"   ✅ Linha {row}: Fórmulas adicionadas")
            except:
                pass

        print(f"\n✅ Fórmulas adicionadas em todas as linhas!")

        # Agora aplicar formatação condicional
        print(f"\n📋 Aplicando formatação condicional...")

        # Remover formatações antigas de AG, AH, AI
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

        # Aplicar nova formatação condicional
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
                            "endRowIndex": ultima_linha,
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
                            "endRowIndex": ultima_linha,
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

        print(f"\n✅ Concluído!")
        print(f"   Colunas: Y (7 dias), Z (30 dias), AA (122 dias)")
        print(f"   Formatação: Verde = Subindo | Vermelho = Caindo")

    except Exception as e:
        print(f"❌ Erro: {e}")

if __name__ == "__main__":
    adicionar_tendencias_com_formatacao()
