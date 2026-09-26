#!/usr/bin/env python3
"""
Analisa a composição de notas para papéis específicos
"""
import gspread
from google.oauth2.service_account import Credentials
import json
import os

PAPEIS = ['LOGG3', 'LPSB3', 'ALOS3', 'SYNE3', 'HBTS5', 'HBRE3', 'OFSA3', 'PEAB4']

def conectar():
    try:
        spreadsheet_id = os.environ.get('SPREADSHEET_ID')
        if not spreadsheet_id:
            print("ERRO: SPREADSHEET_ID não configurado!")
            return None
        sa_json = json.loads(os.environ.get('GOOGLE_CREDENTIALS'))
        creds = Credentials.from_service_account_info(sa_json, scopes=["https://www.googleapis.com/auth/spreadsheets"])
        client = gspread.authorize(creds)
        return client.open_by_key(spreadsheet_id)
    except Exception as e:
        print(f"Erro conexão: {e}")
        return None

def analisar_papel(sheet, ticker):
    ws_dados = sheet.worksheet('Dados')
    ws_bancos = sheet.worksheet('Bancos')

    # Buscar dados
    dados = ws_dados.get_all_values()
    bancos = ws_bancos.get_all_values()
    lista_bancos = [b[0] for b in bancos[1:] if b]

    # Encontrar ticker
    papel_row = None
    for i, row in enumerate(dados):
        if row[0] == ticker:
            papel_row = row
            break

    if not papel_row:
        print(f"{ticker}: ❌ Não encontrado\n")
        return

    # Extrair valores
    ticker = papel_row[0]
    pl = float(papel_row[1]) if papel_row[1] else 0
    lucro = float(papel_row[2]) if papel_row[2] else 0
    roe = float(papel_row[4]) if papel_row[4] else 0
    marg = float(papel_row[5]) if papel_row[5] else 0
    result = float(papel_row[6]) if papel_row[6] else 0
    osc = float(papel_row[7]) if papel_row[7] else 0
    div = float(papel_row[8]) if papel_row[8] else 0
    pvp = float(papel_row[9]) if papel_row[9] else 0
    nota = papel_row[10] if len(papel_row) > 10 else "N/A"
    ativo = float(papel_row[11]) if len(papel_row) > 11 and papel_row[11] else 0

    eh_banco = ticker in lista_bancos

    print(f"{'='*70}")
    print(f"📊 {ticker} | Nota: {nota}")
    print(f"{'='*70}")
    print(f"ROE: {roe:>8.2f}%  | Marg: {marg:>7.2f}%  | Result: {result:>7.2f}% | Osc: {osc:>7.2f}%")
    print(f"Div: {div:>8.2f}%  | P/VP: {pvp:>7.2f}   | P/L:  {pl:>7.2f}   | Ativo: {ativo:>12.0f}")
    print(f"Lucro: {lucro:>15.0f} | Banco: {'SIM' if eh_banco else 'NÃO'}")
    print()

# Conectar
sheet = conectar()
if sheet:
    print("\n🔍 ANÁLISE DE PAPÉIS\n")
    for papel in PAPEIS:
        analisar_papel(sheet, papel)
else:
    print("Não foi possível conectar à planilha.")
