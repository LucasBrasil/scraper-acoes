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

def corrigir():
    service, client, spreadsheet_id = conectar_sheets_api()
    if not service:
        return

    try:
        ss = client.open_by_key(spreadsheet_id)
        ws = ss.worksheet('Acoes')
        dados = ws.get_all_values()
        ultima_linha = len(dados)

        print(f"✅ Aba 'Acoes' conectada")
        print(f"📋 Corrigindo...")

        # 1. Restaurar gráficos sparkline em Y, Z, AA
        print(f"\n1️⃣  Restaurando gráficos sparkline em Y, Z, AA...")
        for row in range(2, ultima_linha + 1):
            try:
                # Y: 7 dias
                ws.update(f'Y{row}', f'=SPARKLINE(GoogleFinance(A{row},"price",TODAY()-7,TODAY()))')
                # Z: 30 dias
                ws.update(f'Z{row}', f'=SPARKLINE(GoogleFinance(A{row},"price",TODAY()-30,TODAY()))')
                # AA: 122 dias
                ws.update(f'AA{row}', f'=SPARKLINE(GoogleFinance(A{row},"price",TODAY()-122,TODAY()))')

                if row % 50 == 0:
                    print(f"   ✅ Linha {row}: Gráficos restaurados")
            except:
                pass

        print(f"   ✅ Gráficos restaurados!")

        # 2. Adicionar fórmulas de tendência em AQ, AR, AS
        print(f"\n2️⃣  Adicionando fórmulas de tendência em AQ, AR, AS...")

        formulas_tendencia = {
            'AQ': '=IF(IFERROR(GOOGLEFINANCE(A{row},"price",TODAY())>GOOGLEFINANCE(A{row},"price",TODAY()-7),0)=1,"Subindo","Caindo")',
            'AR': '=IF(IFERROR(GOOGLEFINANCE(A{row},"price",TODAY())>GOOGLEFINANCE(A{row},"price",TODAY()-30),0)=1,"Subindo","Caindo")',
            'AS': '=IF(IFERROR(GOOGLEFINANCE(A{row},"price",TODAY())>GOOGLEFINANCE(A{row},"price",TODAY()-122),0)=1,"Subindo","Caindo")'
        }

        for row in range(2, ultima_linha + 1):
            try:
                for col, formula_template in formulas_tendencia.items():
                    formula = formula_template.replace('{row}', str(row))
                    ws.update(f'{col}{row}', formula)

                if row % 50 == 0:
                    print(f"   ✅ Linha {row}: Fórmulas adicionadas")
            except:
                pass

        print(f"   ✅ Fórmulas adicionadas!")

        # 3. Aplicar formatação condicional em Y, Z, AA
        print(f"\n3️⃣  Aplicando formatação condicional em Y, Z, AA...")

        sheet_metadata = service.spreadsheets().get(spreadsheetId=spreadsheet_id).execute()
        sheets = sheet_metadata.get('sheets', [])

        acoes_sheet_id = None
        for sheet in sheets:
            if sheet['properties']['title'] == 'Acoes':
                acoes_sheet_id = sheet['properties']['sheetId']
                break

        if acoes_sheet_id is None:
            print("❌ Erro ao encontrar aba")
            return

        # Remover formatações antigas
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
        except:
            pass

        # Aplicar nova formatação
        requests_add = []

        # Y, Z, AA = 24, 25, 26 (0-indexed)
        # AQ, AR, AS = 42, 43, 44 (0-indexed)
        cols_grafico = [
            (24, 'Y', 'AQ', '7 dias'),
            (25, 'Z', 'AR', '30 dias'),
            (26, 'AA', 'AS', '122 dias')
        ]

        for col_idx, col_name, col_formula, periodo in cols_grafico:
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
                                "values": [{"userEnteredValue": f"={col_formula}2=\"Subindo\""}]
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
                                "values": [{"userEnteredValue": f"={col_formula}2=\"Caindo\""}]
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
        print(f"\n📊 Resultado final:")
        print(f"   Y, Z, AA: Gráficos sparkline + Formatação condicional")
        print(f"   AQ, AR, AS: Fórmulas de tendência (Subindo/Caindo)")
        print(f"   🟢 Verde = Subindo | 🔴 Vermelho = Caindo")

    except Exception as e:
        print(f"❌ Erro: {e}")

if __name__ == "__main__":
    corrigir()
