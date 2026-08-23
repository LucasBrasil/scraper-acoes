#!/usr/bin/env python3
import requests
from bs4 import BeautifulSoup
import gspread
from google.oauth2.service_account import Credentials
import time
import json
import os
import sys

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
        return client.open_by_key(spreadsheet_id).worksheet(WORKSHEET_NAME)
    except Exception as e:
        print(f"Erro conexao: {e}")
        return None

def buscar(ticker, tentativa=1):
    """Busca com retry automático"""
    try:
        url = f"https://fundamentus.com.br/resultado.php?papel={ticker}"
        h = {"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120.0.0.0"}
        r = requests.get(url, headers=h, timeout=45)

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

    except requests.exceptions.Timeout:
        if tentativa < 3:
            time.sleep(10)
            return buscar(ticker, tentativa + 1)
        return None
    except Exception as e:
        if tentativa < 3:
            time.sleep(5)
            return buscar(ticker, tentativa + 1)
        return None

def main(inicio=None, fim=None):
    ws = conectar()
    if not ws:
        return

    linhas = ws.get_all_values()
    tickers_dados = []

    inicio = inicio or 0
    fim = fim or len(linhas)

    print("=" * 60)
    print(f"COLETANDO TICKERS {inicio}-{fim}")
    print("=" * 60)

    contador = 0
    for idx, linha in enumerate(linhas[1:], 2):
        if not linha or not linha[0]:
            continue
        ticker = linha[0].strip().upper()
        if not (len(ticker) in [5, 6] and ticker[:-1].isalpha() and ticker[-1].isdigit()):
            continue

        contador += 1

        if contador < inicio or contador > fim:
            continue

        print(f"[{contador:3d}] {ticker:6s}...", end=" ", flush=True)
        dados = buscar(ticker)
        if dados:
            tickers_dados.append((idx, ticker, dados))
            print("OK")
        else:
            print("SKIP")
        time.sleep(1)

    print("\n" + "=" * 60)
    print(f"ATUALIZANDO ({len(tickers_dados)} TICKERS)")
    print("=" * 60)

    ok_count = 0
    for i, (idx, ticker, dados) in enumerate(tickers_dados, 1):
        try:
            print(f"[{i:3d}/{len(tickers_dados)}] {ticker:6s}...", end=" ", flush=True)
            # CORRIGIDO: valores primeiro, depois range_name
            ws.update(
                range_name=f'D{idx}:I{idx}',
                values=[[
                    round(dados['preco'], 2) or 0,
                    f"{round(dados['roe'], 2)}%",
                    f"{round(dados['marg'], 2)}%",
                    f"{round(dados['res12'], 2)}%",
                    f"{round(dados['div'], 2)}%",
                    round(dados['pvp'], 2) or 0
                ]]
            )
            print("OK")
            ok_count += 1
        except Exception as e:
            print(f"ERR: {str(e)[:25]}")

        if i < len(tickers_dados):
            time.sleep(10)

    print("\n" + "=" * 60)
    print(f"CONCLUIDO! {ok_count}/{len(tickers_dados)} atualizados")
    print("=" * 60)

if __name__ == "__main__":
    inicio = None
    fim = None

    if len(sys.argv) >= 3:
        try:
            inicio = int(sys.argv[1])
            fim = int(sys.argv[2])
        except:
            pass

    main(inicio, fim)
