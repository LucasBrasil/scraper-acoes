#!/usr/bin/env python3
import requests
from bs4 import BeautifulSoup
import gspread
from google.oauth2.service_account import Credentials
import time
import json
import os
import sys
import re

WORKSHEET_NAME = "Dados"
SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]
TICKERS_COM_PRECO_SCRAPER = {'ITUB3', 'BBAS3', 'SUZB3', 'ABEV3', 'WEGE3', 'MGLU3', 'LREN3', 'PRIO3', 'VALE3', 'CSNA3', 'SBSP3', 'RENT3'}

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
    try:
        url = f"https://fundamentus.com.br/detalhes.php?papel={ticker}"
        h = {"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120.0.0.0"}
        r = requests.get(url, headers=h, timeout=60)
        if r.status_code != 200:
            return None
        html = r.text

        def extrair_numero(match_obj):
            if not match_obj:
                return 0.0
            texto = match_obj.group(1) if match_obj.lastindex else match_obj.group(0)
            texto = texto.replace('%', '').strip()
            texto = texto.replace('.', '').replace(',', '.')
            try:
                return float(texto)
            except:
                return 0.0

        cotacao = extrair_numero(re.search(r'>Cotação<.*?<span class="txt">\s*([0-9.,]+)', html, re.IGNORECASE | re.DOTALL))
        roe = extrair_numero(re.search(r'>ROE<.*?<span class="txt">\s*([0-9.,]+%)', html, re.IGNORECASE | re.DOTALL))
        marg = extrair_numero(re.search(r'>Marg\. Líquida<.*?<span class="txt">\s*([0-9.,]+%)', html, re.IGNORECASE | re.DOTALL))
        div = extrair_numero(re.search(r'>Div\. Yield<.*?<span class="txt">\s*([0-9.,]+%)', html, re.IGNORECASE | re.DOTALL))
        pvp = extrair_numero(re.search(r'>P/VP<.*?<span class="txt">\s*([0-9.,]+)', html, re.IGNORECASE | re.DOTALL))

        osc_match = re.search(r'>12 meses<.*?<span class="oscil">[^<]*<font[^>]*>([0-9.,\-]+)', html, re.IGNORECASE | re.DOTALL)
        osc_12m = extrair_numero(osc_match) if osc_match else 0.0

        resultado_12m = 0.0
        receita_match = re.search(r'>Receita Líquida<.*?<span class="txt">\s*([0-9.,]+)', html, re.IGNORECASE | re.DOTALL)
        lucro_match = re.search(r'>Lucro Líquido<.*?<span class="txt">\s*([0-9.,]+)', html, re.IGNORECASE | re.DOTALL)
        if receita_match and lucro_match:
            receita = extrair_numero(receita_match)
            lucro = extrair_numero(lucro_match)
            if receita > 0:
                resultado_12m = (lucro / receita) * 100

        # Novos indicadores
        pl = extrair_numero(re.search(r'>P/L<.*?<span class="txt">\s*([0-9.,\-]+)', html, re.IGNORECASE | re.DOTALL))
        lucro = extrair_numero(re.search(r'>Lucro Líquido<.*?<span class="txt">\s*([0-9.,\-]+)', html, re.IGNORECASE | re.DOTALL))
        ativo = extrair_numero(re.search(r'>Ativo</span></td>\s*<td[^>]*><span class="txt">\s*([0-9.,]+)', html, re.IGNORECASE | re.DOTALL))

        return {'preco': cotacao, 'roe': roe, 'marg': marg, 'osc_12m': osc_12m, 'res_12m': resultado_12m, 'div': div, 'pvp': pvp, 'pl': pl, 'lucro': lucro, 'ativo': ativo}
    except requests.exceptions.Timeout:
        if tentativa < 3:
            time.sleep(10)
            return buscar(ticker, tentativa + 1)
        return None
    except Exception:
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
        if not (len(ticker) in [5, 6] and ticker.isalnum()):
            if ticker:
                print(f"SKIP linha {idx}: '{ticker}' (len={len(ticker)}, isalnum={ticker.isalnum()})")
            continue
        contador += 1
        if contador < inicio or contador > fim:
            continue
        print(f"[{contador:3d}] {ticker:6s}...", end=" ", flush=True)
        try:
            dados = buscar(ticker)
        except Exception as e:
            print(f"ERR(busca): {str(e)[:20]}")
            dados = None
            time.sleep(5)
            continue
        if dados and (dados['preco'] or dados['roe'] or dados['marg']):
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
            # Determinar valor do preço (vazio se usar Google Finance)
            preco_val = round(dados['preco'], 2) if (ticker in TICKERS_COM_PRECO_SCRAPER and dados['preco']) else ''
            # Gravar tudo em um único update para evitar problemas
            ws.update(range_name=f'B{idx}:L{idx}', values=[[
                round(dados['pl'], 2) if dados['pl'] else '',
                round(dados['lucro'], 0) if dados['lucro'] else '',
                preco_val,
                f"{round(dados['roe'], 2)}%",
                f"{round(dados['marg'], 2)}%",
                f"{round(dados['res_12m'], 2)}%",
                f"{round(dados['osc_12m'], 2)}%",
                f"{round(dados['div'], 2)}%",
                round(dados['pvp'], 2) if dados['pvp'] else '',
                '',  # Coluna K (NOTA)
                round(dados['ativo'], 0) if dados['ativo'] else ''
            ]])
            print("OK")
            ok_count += 1
        except Exception as e:
            print(f"ERR: {str(e)[:40]}")
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
