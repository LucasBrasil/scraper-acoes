#!/usr/bin/env python3
"""
Busca a paridade/proporção dos BDRs no Status Invest.
Grava na coluna G ("Proporção / Paridade") da aba 'Dados BDRs' como
o número de BDRs equivalentes a 1 ação original (ex: 24 significa
1 ação = 24 BDRs, ou seja, 1 BDR = 1/24 de ação).
"""
import gspread
from google.oauth2.service_account import Credentials
import requests
import re
import json
import os
import time

WORKSHEET_NAME = "Dados BDRs"
SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept-Language": "pt-BR,pt;q=0.9",
}

def conectar():
    try:
        spreadsheet_id = os.environ.get('SPREADSHEET_ID')
        sa_json = json.loads(os.environ.get('GOOGLE_CREDENTIALS'))
        creds = Credentials.from_service_account_info(sa_json, scopes=SCOPES)
        client = gspread.authorize(creds)
        return client.open_by_key(spreadsheet_id).worksheet(WORKSHEET_NAME)
    except Exception as e:
        print(f"Erro conexao: {e}")
        return None

def buscar_paridade_statusinvest(bdr_ticker):
    url = f"https://statusinvest.com.br/bdrs/{bdr_ticker.lower()}"
    r = requests.get(url, headers=HEADERS, timeout=15)
    if r.status_code != 200:
        return None
    m = re.search(
        r'Paridade Inicial[^<]*</span>\s*</span>\s*<div>\s*<strong class="value">1 Stock = (\d+) BDR',
        r.text, re.DOTALL
    )
    if not m:
        return None
    valor = int(m.group(1))
    return valor if valor > 0 else None

def buscar_paridade_investidor10(bdr_ticker):
    url = f"https://investidor10.com.br/bdrs/{bdr_ticker.lower()}/"
    r = requests.get(url, headers=HEADERS, timeout=15)
    if r.status_code != 200:
        return None
    m = re.search(r'Paridade da BDR.*?class="value">\s*1 Stock = (\d+) BDR', r.text, re.DOTALL)
    if not m:
        return None
    valor = int(m.group(1))
    return valor if valor > 0 else None

def buscar_paridade(bdr_ticker, tentativa=1):
    try:
        valor = buscar_paridade_statusinvest(bdr_ticker)
        if valor:
            return valor
        return buscar_paridade_investidor10(bdr_ticker)

    except requests.exceptions.Timeout:
        if tentativa < 3:
            time.sleep(3)
            return buscar_paridade(bdr_ticker, tentativa + 1)
        return None
    except Exception as e:
        print(f"   ⚠️  Erro: {str(e)[:60]}")
        return None

def main():
    ws = conectar()
    if not ws:
        return

    linhas = ws.get_all_values()

    print("=" * 60)
    print("BUSCANDO PARIDADE/PROPORÇÃO DOS BDRs (Status Invest)")
    print("=" * 60)

    ok_count = 0
    total = 0

    for idx, linha in enumerate(linhas[1:], 2):
        if not linha or not linha[0]:
            continue

        bdr_ticker = linha[0].strip().upper()
        total += 1

        print(f"[{total:3d}] {bdr_ticker:8s}...", end=" ", flush=True)

        paridade = buscar_paridade(bdr_ticker)

        if paridade:
            try:
                ws.update(range_name=f'G{idx}', values=[[f"1/{paridade}"]])
                print(f"OK (1 BDR = 1/{paridade} ação)")
                ok_count += 1
            except Exception as e:
                print(f"ERR ao gravar: {str(e)[:40]}")
        else:
            print("SKIP (não encontrado na fonte)")

        time.sleep(1.5)

    print("\n" + "=" * 60)
    print(f"CONCLUIDO! {ok_count}/{total} atualizados")
    print("=" * 60)

if __name__ == "__main__":
    main()
