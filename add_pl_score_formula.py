#!/usr/bin/env python3
import gspread
from google.oauth2.service_account import Credentials
import json
import os

WORKSHEET_NAME = "Dados"
SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]

def conectar():
    try:
        spreadsheet_id = os.environ.get('SPREADSHEET_ID')
        if not spreadsheet_id or spreadsheet_id == "COLE_AQUI_O_ID_DA_PLANILHA":
            print("ERRO: SPREADSHEET_ID nao configurado!")
            return None
        sa_json = json.loads(os.environ.get('GOOGLE_CREDENTIALS'))
        creds = Credentials.from_service_account_info(sa_json, scopes=SCOPES)
        client = gspread.authorize(creds)
        spreadsheet = client.open_by_key(spreadsheet_id)
        return spreadsheet
    except Exception as e:
        print(f"Erro conexao: {e}")
        return None

def main():
    spreadsheet = conectar()
    if not spreadsheet:
        return

    ws = spreadsheet.worksheet(WORKSHEET_NAME)

    print("=" * 60)
    print("ADICIONANDO FÓRMULA P/L SCORE")
    print("=" * 60)

    # Fórmula para calcular P/L Score baseado na regra
    # Se P/L < 0 = -1
    # Se P/L >= 0 e P/L < 5 = 1
    # Se P/L >= 5 e P/L < 10 = 0
    # Se P/L >= 10 = -1

    pl_score_formula = '''=IF(B2<0, -1, IF(AND(B2>=0, B2<5), 1, IF(AND(B2>=5, B2<10), 0, IF(B2>=10, -1, 0))))'''

    # Adicionar na coluna M (supondo que L é Ativo, então M seria a próxima)
    # Ou você pode especificar outra coluna

    print(f"Fórmula P/L Score:\n{pl_score_formula}\n")

    # Adicionar header
    try:
        ws.update(range_name='M1', values=[['P/L Score']])
        print("✅ Header 'P/L Score' adicionado em M1")
    except Exception as e:
        print(f"ERRO ao adicionar header: {e}")
        return

    # Adicionar fórmula nas linhas (a partir de M2)
    linhas = ws.get_all_values()

    print(f"\nAdicionando fórmula nas linhas 2 a {len(linhas)}...")

    for i in range(2, len(linhas) + 1):
        try:
            # Ajustar a fórmula para cada linha
            formula = f'=IF(B{i}<0, -1, IF(AND(B{i}>=0, B{i}<5), 1, IF(AND(B{i}>=5, B{i}<10), 0, IF(B{i}>=10, -1, 0))))'
            ws.update(range_name=f'M{i}', values=[[formula]])
        except Exception as e:
            if i < 10:  # Mostrar só os primeiros erros
                print(f"Linha {i}: {e}")

    print(f"\n✅ Fórmula P/L Score adicionada em M2:M{len(linhas)}")

    print("\n" + "=" * 60)
    print("✅ FÓRMULA P/L SCORE ADICIONADA COM SUCESSO!")
    print("Localização: Coluna M (P/L Score)")
    print("=" * 60)

if __name__ == "__main__":
    main()
