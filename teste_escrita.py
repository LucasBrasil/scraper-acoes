#!/usr/bin/env python3
import gspread
from google.oauth2.service_account import Credentials
import json
import os

WORKSHEET_NAME = "Dados"
SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]

try:
    spreadsheet_id = os.environ.get('SPREADSHEET_ID')
    print(f"SPREADSHEET_ID: {spreadsheet_id}")

    if not spreadsheet_id or spreadsheet_id == "COLE_AQUI_O_ID_DA_PLANILHA":
        print("ERRO: SPREADSHEET_ID não configurado!")
        exit(1)

    sa_json = json.loads(os.environ.get('GOOGLE_CREDENTIALS'))
    creds = Credentials.from_service_account_info(sa_json, scopes=SCOPES)
    client = gspread.authorize(creds)

    print(f"Conectando à planilha...")
    spreadsheet = client.open_by_key(spreadsheet_id)
    print(f"Planilha aberta: {spreadsheet.title}")

    ws = spreadsheet.worksheet(WORKSHEET_NAME)
    print(f"Aba '{WORKSHEET_NAME}' encontrada")

    # Testar escrita em uma célula
    print(f"\nTentando escrever em B2...")
    ws.update(range_name='B2', values=[['TESTE_WRITE_123']])
    print(f"✓ Escrita bem-sucedida!")

    # Ler o valor de volta
    print(f"Lendo valor de B2...")
    valor = ws.acell('B2').value
    print(f"Valor lido: {valor}")

    if valor == 'TESTE_WRITE_123':
        print(f"✓ Leitura/escrita funcionando corretamente!")
    else:
        print(f"✗ Valor escrito não corresponde ao lido!")

except Exception as e:
    print(f"ERRO: {e}")
    import traceback
    traceback.print_exc()
