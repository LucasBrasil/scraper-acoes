#!/usr/bin/env python3
import gspread
from google.oauth2.service_account import Credentials
from googleapiclient.discovery import build
import json
import os
import time

SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]

def conectar():
    spreadsheet_id = os.environ.get('SPREADSHEET_ID')
    sa_json = json.loads(os.environ.get('GOOGLE_CREDENTIALS'))
    creds = Credentials.from_service_account_info(sa_json, scopes=SCOPES)
    service = build('sheets', 'v4', credentials=creds)
    client = gspread.authorize(creds)
    return service, client, spreadsheet_id

def apenas_formulas():
    service, client, spreadsheet_id = conectar()

    try:
        ss = client.open_by_key(spreadsheet_id)
        ws = ss.worksheet('Acoes')
        dados = ws.get_all_values()
        ultima_linha = len(dados)

        print("📋 Adicionando apenas fórmulas em AQ, AR, AS...")

        formulas = {
            'AQ': '=IF(IFERROR(GOOGLEFINANCE(A{row},"price",TODAY())>GOOGLEFINANCE(A{row},"price",TODAY()-7),0)=1,"Subindo","Caindo")',
            'AR': '=IF(IFERROR(GOOGLEFINANCE(A{row},"price",TODAY())>GOOGLEFINANCE(A{row},"price",TODAY()-30),0)=1,"Subindo","Caindo")',
            'AS': '=IF(IFERROR(GOOGLEFINANCE(A{row},"price",TODAY())>GOOGLEFINANCE(A{row},"price",TODAY()-122),0)=1,"Subindo","Caindo")'
        }

        # Adicionar todas as fórmulas de uma vez com batch
        updates = []
        for row in range(2, ultima_linha + 1):
            for col, formula_template in formulas.items():
                formula = formula_template.replace('{row}', str(row))
                updates.append({
                    'range': f'{col}{row}',
                    'values': [[formula]]
                })

        # Enviar em batches menores
        batch_size = 100
        for i in range(0, len(updates), batch_size):
            batch = updates[i:i+batch_size]
            try:
                ws.batch_update(batch, value_input_option='USER_ENTERED')
                print(f"   ✅ Batch {i//batch_size + 1}: {len(batch)} células atualizadas")
                time.sleep(2)  # Aguardar entre batches
            except Exception as e:
                print(f"   ❌ Erro no batch {i//batch_size + 1}: {e}")
                break

        print(f"\n✅ Fórmulas adicionadas em AQ, AR, AS!")

        # Aplicar formatação condicional
        print(f"\n📋 Aplicando formatação condicional...")

        sheet_metadata = service.spreadsheets().get(spreadsheetId=spreadsheet_id).execute()
        sheets = sheet_metadata.get('sheets', [])
        acoes_sheet_id = None
        for sheet in sheets:
            if sheet['properties']['title'] == 'Acoes':
                acoes_sheet_id = sheet['properties']['sheetId']
                break

        # Remover antigas
        requests_delete = []
        for i in range(50):
            requests_delete.append({
                "deleteConditionalFormatRule": {
                    "sheetId": acoes_sheet_id,
                    "index": i
                }
            })

        body = {'requests': requests_delete}
        try:
            service.spreadsheets().batchUpdate(spreadsheetId=spreadsheet_id, body=body).execute()
            print(f"   ✅ Formatações antigas removidas")
            time.sleep(1)
        except:
            pass

        # Aplicar novas
        requests_add = []
        cols_grafico = [
            (24, 'Y', 'AQ'),
            (25, 'Z', 'AR'),
            (26, 'AA', 'AS')
        ]

        for col_idx, col_name, col_formula in cols_grafico:
            # Verde
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
                                "values": [{"userEnteredValue": f"={col_formula}2=\"Subindo\""}]
                            },
                            "format": {
                                "backgroundColor": {"red": 0.0, "green": 1.0, "blue": 0.0, "alpha": 0.3}
                            }
                        }
                    }
                }
            })

            # Vermelho
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
                                "values": [{"userEnteredValue": f"={col_formula}2=\"Caindo\""}]
                            },
                            "format": {
                                "backgroundColor": {"red": 1.0, "green": 0.0, "blue": 0.0, "alpha": 0.3}
                            }
                        }
                    }
                }
            })

        body = {'requests': requests_add}
        service.spreadsheets().batchUpdate(spreadsheetId=spreadsheet_id, body=body).execute()
        print(f"   ✅ Formatação aplicada!")

        print(f"\n✅ Concluído!")
        print(f"   Y, Z, AA: Formatação condicional (Verde/Vermelho)")
        print(f"   AQ, AR, AS: Fórmulas de tendência")

    except Exception as e:
        print(f"❌ Erro: {e}")

if __name__ == "__main__":
    apenas_formulas()
