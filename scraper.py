#!/usr/bin/env python3
import requests
from bs4 import BeautifulSoup
import gspread
from google.oauth2.service_account import Credentials
import time
import json
from datetime import datetime

SPREADSHEET_ID = "COLE_AQUI_O_ID_DA_PLANILHA"
WORKSHEET_NAME = "Dados"
SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]

def conectar():
    try:
        sa_json = json.loads(__import__('os').environ.get('GOOGLE_CREDENTIALS'))
        creds = Credentials.from_service_account_info(sa_json, scopes=SCOPES)
        client = gspread.authorize(creds)
        return client.open_by_key(SPREADSHEET_ID).worksheet(WORKSHEET_NAME)
    except Exception as e:
        print(f"Erro conexao: {e}")
        return None

def buscar(ticker):
    try:
        url = f"https://fundamentus.com.br/resultado.php?papel={ticker}"
        h = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
        r = requests.get(url, headers=h, timeout=30)
        if r.status_code != 200:
            return None

        soup = BeautifulSoup(r.text, 'html.parser')
        tds = soup.find_all('td')

        def achar(label):
            for i, td in enumerate(tds):
                if label.lower() in td.get_text().lower() and i+1 < len(tds):
                    v = tds[i+1].get_text().strip().replace('%','').replace('.','').replace(',','.')
                    try:
                        return float(v)
                    except:
                        return 0.0
            return 0.0

        return {
            'preco': achar('Cotacao'),
            'roe': achar('ROE'),
            'marg': achar('Marg'),
            'res12': achar('Resultado'),
            'div': achar('Yield'),
            'pvp': achar('P/VP')
        }
    except:
        return None

def main():
    ws = conectar()
    if not ws:
        return

    print("Coletando dados...")
    linhas = ws.get_all_values()
    tickers_dados = []

    for idx, linha in enumerate(linhas[1:], 2):
        if not linha or not linha[0]:
            continue
        ticker = linha[0].strip().upper()
        if not (len(ticker) in [5, 6] and ticker[:-1].isalpha() and ticker[-1].isdigit()):
            continue

        print(f"[{len(tickers_dados)+1}] {ticker}...", end=" ")
        dados = buscar(ticker)
        if dados:
            tickers_dados.append((idx, ticker, dados))
            print("OK")
        else:
            print("FAIL")
        time.sleep(2)

    print(f"\nAtualizando {len(tickers_dados)} tickers (LENTO)...")

    for i, (idx, ticker, dados) in enumerate(tickers_dados, 1):
        try:
            print(f"[{i}/{len(tickers_dados)}] {ticker}...", end=" ")
            ws.update(f'Dados!D{idx}:I{idx}', [[
                round(dados['preco'], 2) or 0,
                f"{round(dados['roe'], 2)}%",
                f"{round(dados['marg'], 2)}%",
                f"{round(dados['res12'], 2)}%",
                f"{round(dados['div'], 2)}%",
                round(dados['pvp'], 2) or 0
            ]])
            print("OK")
        except Exception as e:
            print(f"ERRO: {str(e)[:30]}")

        if i < len(tickers_dados):
            time.sleep(10)

    print(f"\nConcluido! {len(tickers_dados)} atualizados")

if __name__ == "__main__":
    main()
