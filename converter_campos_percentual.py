#!/usr/bin/env python3
"""
Remove % dos campos: ROE%, Marg.Liq%, Result.12M%, Osc.12M%, %Div
"""
import gspread
from google.oauth2.service_account import Credentials
import json
import os

def converter_valor(valor):
    """Remove % e converte para número"""
    if not valor:
        return ''

    valor_str = str(valor).replace('%', '').strip()
    try:
        return float(valor_str)
    except:
        return ''

def converter_coluna(ws, col_letra, col_numero):
    """Converte uma coluna de texto com % para número"""
    dados = ws.get_all_values()
    total_linhas = len(dados)

    print(f"Convertendo coluna {col_letra}...")

    for row in range(2, total_linhas + 1):
        valor = dados[row-1][col_numero-1] if col_numero-1 < len(dados[row-1]) else ""

        if valor and '%' in str(valor):
            valor_convertido = converter_valor(valor)
            if valor_convertido != '':
                try:
                    ws.update(range_name=f'{col_letra}{row}', values=[[valor_convertido]])
                except Exception as e:
                    print(f"  ❌ Erro em {col_letra}{row}: {e}")

        if row % 50 == 0:
            print(f"  ✅ Linhas até {row} processadas")

    print(f"✅ Coluna {col_letra} convertida!\n")

# Conectar
try:
    spreadsheet_id = os.environ.get('SPREADSHEET_ID')
    sa_json = json.loads(os.environ.get('GOOGLE_CREDENTIALS'))
    creds = Credentials.from_service_account_info(sa_json, scopes=["https://www.googleapis.com/auth/spreadsheets"])
    client = gspread.authorize(creds)
    sheet = client.open_by_key(spreadsheet_id)
    ws = sheet.worksheet("Dados")

    print("\n🔧 CONVERTENDO CAMPOS COM %\n")
    print("=" * 60)

    # Colunas a converter:
    # E = ROE%
    # F = Marg.Liq%
    # G = Result.12M%
    # H = Osc.12M%
    # I = %Div

    converter_coluna(ws, 'E', 5)  # ROE%
    converter_coluna(ws, 'F', 6)  # Marg.Liq%
    converter_coluna(ws, 'G', 7)  # Result.12M%
    converter_coluna(ws, 'H', 8)  # Osc.12M%
    converter_coluna(ws, 'I', 9)  # %Div

    print("=" * 60)
    print("\n✅ CONVERSÃO COMPLETA!")
    print("Todos os campos de percentual foram convertidos para números.\n")

except Exception as e:
    print(f"❌ Erro: {e}")
