#!/usr/bin/env python3
import gspread
from google.oauth2.service_account import Credentials
import json
import os

WORKSHEET_NAME = "Regras"
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
        return client.open_by_key(spreadsheet_id).worksheet(WORKSHEET_NAME)
    except Exception as e:
        print(f"Erro conexao: {e}")
        return None

def main():
    ws = conectar()
    if not ws:
        return

    print("=" * 60)
    print("ADICIONANDO REGRA P/L")
    print("=" * 60)

    # Estrutura da regra P/L
    regra_pl = [
        ["P/L", "", "", "", ""],
        ["Se P/L < 0", "=", "-1", "", ""],
        ["Se P/L >= 0 e P/L < 5", "=", "1", "", ""],
        ["Se P/L >= 5 e P/L < 10", "=", "0", "", ""],
        ["Se P/L >= 10", "=", "-1", "", ""],
    ]

    # Encontrar a próxima linha vazia após as regras existentes
    valores = ws.get_all_values()

    # Procurar pela última linha com dados
    ultima_linha = 0
    for i, linha in enumerate(valores):
        if any(linha):  # Se a linha tem algum conteúdo
            ultima_linha = i + 1

    # Adicionar a nova regra
    inicio_linha = ultima_linha + 2  # Deixar uma linha em branco

    print(f"Adicionando regra P/L a partir da linha {inicio_linha}")

    for i, linha in enumerate(regra_pl):
        linha_numero = inicio_linha + i
        try:
            ws.update(range_name=f'A{linha_numero}:E{linha_numero}', values=[linha])
            print(f"Linha {linha_numero}: {linha[0]}")
        except Exception as e:
            print(f"ERRO na linha {linha_numero}: {e}")

    print("\n" + "=" * 60)
    print("✅ REGRA P/L ADICIONADA COM SUCESSO!")
    print("=" * 60)

if __name__ == "__main__":
    main()
