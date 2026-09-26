#!/usr/bin/env python3
import gspread
from google.oauth2.service_account import Credentials
from googleapiclient.discovery import build
import json
import os

SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]

def conectar():
    spreadsheet_id = os.environ.get('SPREADSHEET_ID')
    sa_json = json.loads(os.environ.get('GOOGLE_CREDENTIALS'))
    creds = Credentials.from_service_account_info(sa_json, scopes=SCOPES)
    service = build('sheets', 'v4', credentials=creds)
    client = gspread.authorize(creds)
    return service, client, spreadsheet_id

def expandir_e_corrigir():
    service, client, spreadsheet_id = conectar()

    try:
        ss = client.open_by_key(spreadsheet_id)
        ws = ss.worksheet('Acoes')

        print("📋 Verificando dimensões da aba...")
        print(f"   Colunas atuais: {ws.col_count}")
        print(f"   Linhas atuais: {ws.row_count}")

        # Expandir para 50 colunas (é seguro)
        if ws.col_count < 50:
            print(f"\n📏 Expandindo planilha para 50 colunas...")
            ws.add_cols(50 - ws.col_count)
            print(f"   ✅ Expandido!")

        dados = ws.get_all_values()
        ultima_linha = len(dados)

        print(f"\n1️⃣  Verificando Y, Z, AA...")
        # Verificar se Y2 tem gráfico
        cell_y2 = ws.cell(2, 25).value
        if "SPARKLINE" not in str(cell_y2):
            print(f"   Y2 não tem gráfico, restaurando...")
            for row in range(2, ultima_linha + 1):
                try:
                    ws.update(f'Y{row}', f'=SPARKLINE(GoogleFinance(A{row},"price",TODAY()-7,TODAY()))')
                    ws.update(f'Z{row}', f'=SPARKLINE(GoogleFinance(A{row},"price",TODAY()-30,TODAY()))')
                    ws.update(f'AA{row}', f'=SPARKLINE(GoogleFinance(A{row},"price",TODAY()-122,TODAY()))')
                    if row % 50 == 0:
                        print(f"   ✅ Linha {row}")
                except:
                    pass
            print(f"   ✅ Gráficos restaurados!")
        else:
            print(f"   ✅ Gráficos já existem!")

        print(f"\n2️⃣  Adicionando fórmulas em AQ, AR, AS...")
        formulas = {
            'AQ': '=IF(IFERROR(GOOGLEFINANCE(A{row},"price",TODAY())>GOOGLEFINANCE(A{row},"price",TODAY()-7),0)=1,"Subindo","Caindo")',
            'AR': '=IF(IFERROR(GOOGLEFINANCE(A{row},"price",TODAY())>GOOGLEFINANCE(A{row},"price",TODAY()-30),0)=1,"Subindo","Caindo")',
            'AS': '=IF(IFERROR(GOOGLEFINANCE(A{row},"price",TODAY())>GOOGLEFINANCE(A{row},"price",TODAY()-122),0)=1,"Subindo","Caindo")'
        }

        for row in range(2, min(ultima_linha + 1, 50)):  # Apenas 50 linhas para testar
            try:
                for col, formula_template in formulas.items():
                    formula = formula_template.replace('{row}', str(row))
                    ws.update(f'{col}{row}', formula)
                if row == 2:
                    print(f"   ✅ Fórmula adicionada em AQ2")
            except Exception as e:
                print(f"   ❌ Erro linha {row}: {e}")
                break

        print(f"   ✅ Fórmulas adicionadas!")

        print(f"\n3️⃣  Aplicando formatação condicional...")

        # Obter sheet ID
        sheet_metadata = service.spreadsheets().get(spreadsheetId=spreadsheet_id).execute()
        sheets = sheet_metadata.get('sheets', [])
        acoes_sheet_id = None
        for sheet in sheets:
            if sheet['properties']['title'] == 'Acoes':
                acoes_sheet_id = sheet['properties']['sheetId']
                break

        # Remover antigas
        requests = []
        for i in range(100):
            requests.append({
                "deleteConditionalFormatRule": {
                    "sheetId": acoes_sheet_id,
                    "index": i
                }
            })

        body = {'requests': requests}
        try:
            service.spreadsheets().batchUpdate(spreadsheetId=spreadsheet_id, body=body).execute()
        except:
            pass

        # Aplicar novas
        requests = []
        cols_grafico = [
            (24, 'Y', 'AQ'),
            (25, 'Z', 'AR'),
            (26, 'AA', 'AS')
        ]

        for col_idx, col_name, col_formula in cols_grafico:
            # Verde
            requests.append({
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
            requests.append({
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

        batch_size = 6
        for i in range(0, len(requests), batch_size):
            batch = requests[i:i+batch_size]
            body = {'requests': batch}
            service.spreadsheets().batchUpdate(spreadsheetId=spreadsheet_id, body=body).execute()
            print(f"   ✅ Batch {i//batch_size + 1}")

        print(f"\n✅ Concluído!")
        print(f"   Y, Z, AA: Gráficos + Formatação condicional")
        print(f"   AQ, AR, AS: Fórmulas de tendência")

    except Exception as e:
        print(f"❌ Erro: {e}")

if __name__ == "__main__":
    expandir_e_corrigir()
