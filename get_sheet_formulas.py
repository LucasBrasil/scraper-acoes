#!/usr/bin/env python3
import gspread
from google.oauth2.service_account import Credentials
import json
import os

SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]

def conectar():
    try:
        spreadsheet_id = os.environ.get('SPREADSHEET_ID')
        if not spreadsheet_id:
            print("ERRO: SPREADSHEET_ID nao configurado!")
            return None
        sa_json = json.loads(os.environ.get('GOOGLE_CREDENTIALS'))
        creds = Credentials.from_service_account_info(sa_json, scopes=SCOPES)
        client = gspread.authorize(creds)
        return client.open_by_key(spreadsheet_id)
    except Exception as e:
        print(f"Erro conexao: {e}")
        return None

def main():
    spreadsheet = conectar()
    if not spreadsheet:
        return

    print("=" * 100)
    print("FÓRMULAS DA PLANILHA")
    print("=" * 100)

    # Ler fórmula da coluna K (Nota) - linha 2
    try:
        ws_dados = spreadsheet.worksheet("Dados")
        cell_k2 = ws_dados.cell(2, 11)  # Coluna K = 11

        print("\n📊 COLUNA K (NOTA) - Fórmula de Scoring:\n")
        print(f"Célula K2:\n{cell_k2.value}\n")

        if not cell_k2.value or "=" not in str(cell_k2.value):
            print("⚠️ Nenhuma fórmula encontrada em K2")
        else:
            print("✅ Fórmula encontrada!")

    except Exception as e:
        print(f"ERRO ao ler K2: {e}")

    # Ler tabela de regras
    try:
        ws_regras = spreadsheet.worksheet("Regras")
        valores = ws_regras.get_all_values()

        print("\n" + "=" * 100)
        print("📋 TABELA DE REGRAS (Aba 'Regras'):\n")

        for i, linha in enumerate(valores[:20]):  # Primeiras 20 linhas
            if linha and any(linha):
                print(f"Linha {i+1}: {linha}")

    except Exception as e:
        print(f"ERRO ao ler Regras: {e}")

if __name__ == "__main__":
    main()
