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

def adicionar_indicadores():
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
        print(f"\n📋 Adicionando indicadores de tendência...")

        # Colunas dos sparklines (você pode ajustar conforme necessário)
        # Assumindo que os sparklines estão em colunas específicas
        # Exemplo: AD, AE, AF para os 3 períodos

        # Vou criar fórmulas para 3 colunas de indicadores (próximas aos sparklines)
        # Exemplo: AG, AH, AI para os indicadores de tendência

        # Fórmulas para detectar tendência:
        # Compara preço atual com preço inicial do período

        formulas_config = [
            {
                'name': '7 dias',
                'sparkline_col': 'AD',  # Coluna do sparkline
                'indicator_col': 'AG',  # Coluna para indicador
                'formula': '=IF(IFERROR(GOOGLEFINANCE(A{row},"price",TODAY())>GOOGLEFINANCE(A{row},"price",TODAY()-7),0)=1,"Subindo","Caindo")'
            },
            {
                'name': '30 dias',
                'sparkline_col': 'AE',
                'indicator_col': 'AH',
                'formula': '=IF(IFERROR(GOOGLEFINANCE(A{row},"price",TODAY())>GOOGLEFINANCE(A{row},"price",TODAY()-30),0)=1,"Subindo","Caindo")'
            },
            {
                'name': '122 dias',
                'sparkline_col': 'AF',
                'indicator_col': 'AI',
                'formula': '=IF(IFERROR(GOOGLEFINANCE(A{row},"price",TODAY())>GOOGLEFINANCE(A{row},"price",TODAY()-122),0)=1,"Subindo","Caindo")'
            }
        ]

        print(f"\n📊 Fórmulas para detectar tendência:")
        print(f"\n7 dias   → Coluna AG: Se preço atual > preço (TODAY-7) → VERDE / VERMELHO")
        print(f"30 dias  → Coluna AH: Se preço atual > preço (TODAY-30) → VERDE / VERMELHO")
        print(f"122 dias → Coluna AI: Se preço atual > preço (TODAY-122) → VERDE / VERMELHO")

        print(f"\n⚙️  Próximas ações:")
        print(f"1. Adicione em AG2 (7 dias):")
        print(f"   {formulas_config[0]['formula'].replace('{row}', '2')}")
        print(f"\n2. Adicione em AH2 (30 dias):")
        print(f"   {formulas_config[1]['formula'].replace('{row}', '2')}")
        print(f"\n3. Adicione em AI2 (122 dias):")
        print(f"   {formulas_config[2]['formula'].replace('{row}', '2')}")

        print(f"\n4. Copie as fórmulas para todas as linhas")

        print(f"\n5. Depois aplique formatação condicional:")
        print(f"   - Se 'Subindo' → Fundo VERDE")
        print(f"   - Se 'Caindo' → Fundo VERMELHO")

        print(f"\n💡 Alternativa (mais simples):")
        print(f"Use apenas um número em vez de texto:")
        print(f"   =IF(IFERROR(GOOGLEFINANCE(A{{row}},\"price\",TODAY())>GOOGLEFINANCE(A{{row}},\"price\",TODAY()-7),0),1,-1)")
        print(f"   Se resultado = 1 → Subindo (verde)")
        print(f"   Se resultado = -1 → Caindo (vermelho)")

    except Exception as e:
        print(f"Erro: {e}")

if __name__ == "__main__":
    adicionar_indicadores()
