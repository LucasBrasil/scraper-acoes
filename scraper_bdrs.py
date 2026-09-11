#!/usr/bin/env python3
"""
Scraper de BDRs - busca dados via yfinance
- Preço/Volume/Variação 12M: do próprio BDR na B3 (ticker + .SA), reflete câmbio BRL
- Fundamentos (ROE, P/L, P/VP, Receita, Lucro, %Div): do ticker original (mercado de origem)
"""
import gspread
from google.oauth2.service_account import Credentials
import yfinance as yf
import json
import os
import sys
import time

WORKSHEET_NAME = "Dados BDRs"
SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]

# Mapeamento BDR -> Ticker original (validado com o usuário)
MAPA_TICKERS = {
    'MSFT34': 'MSFT',
    'MELI34': 'MELI',
    'AAPL34': 'AAPL',
    'NFLX34': 'NFLX',
    'TSLA34': 'TSLA',
    'SPCX34': None,  # SpaceX - empresa privada, sem dados públicos
    'GOGL34': 'GOOGL',
    'BABA34': 'BABA',
    'M1TA34': 'META',
    'MCDC34': 'MCD',
    'PYPL34': 'PYPL',
    'NVDC34': 'NVDA',
    'COCA34': 'KO',
    'GMCO34': 'GM',
    'D1OC34': 'DOCU',
    'AMZO34': 'AMZN',
    'BERK34': 'BRK-B',
    'NIKE34': 'NKE',
    'DISB34': 'DIS',
    'U1BE34': 'UBER',
    'XPBR31': 'XP',
    'INBR32': 'INTR',
    'ROXO34': 'NU',
    'LILY34': 'LLY',
    'BEWJ39': 'EWJ',
    'BEWA39': 'EWA',
    'BEWQ39': 'EWQ',
    'BIJR39': 'IJR',
    'BIVW39': 'IVW',
    'BIEV39': 'IEV',
    'BIHI39': 'IHI',
    'BERU39': 'ERUS',  # Suspenso desde 2022 (sanções Rússia) - dados podem estar congelados
    'JEPI39': 'JEPI',
    'AURA33': 'AUGO',
    'JBSS32': 'JBS',
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

def buscar_dados_bdr(bdr_ticker, ticker_original, tentativa=1):
    try:
        dados = {}

        # 1. Dados do BDR na B3 (preço/volume/variação em BRL)
        bdr_yf = yf.Ticker(f"{bdr_ticker}.SA")
        bdr_info = bdr_yf.info

        dados['vl_atu'] = bdr_info.get('currentPrice') or bdr_info.get('regularMarketPrice')
        dados['liquidez'] = bdr_info.get('averageVolume')

        # Variação 12M do BDR (reflete câmbio)
        hist = bdr_yf.history(period="1y")
        if not hist.empty and len(hist) > 1:
            preco_inicial = hist['Close'].iloc[0]
            preco_final = hist['Close'].iloc[-1]
            if preco_inicial:
                dados['var_12m'] = round(((preco_final - preco_inicial) / preco_inicial) * 100, 2)
            else:
                dados['var_12m'] = None
        else:
            dados['var_12m'] = None

        # 2. Fundamentos da empresa original
        if ticker_original:
            orig_yf = yf.Ticker(ticker_original)
            orig_info = orig_yf.info

            dados['roe'] = orig_info.get('returnOnEquity')
            dados['pl'] = orig_info.get('trailingPE')
            dados['pvp'] = orig_info.get('priceToBook')
            dados['receita'] = orig_info.get('totalRevenue')
            dados['lucro'] = orig_info.get('netIncomeToCommon')

            div_yield = orig_info.get('dividendYield')
            # Sanidade: fundo suspenso/não-negociável (ex: ERUS por sanções) retorna lixo
            if div_yield is not None and (div_yield > 50 or orig_info.get('tradeable') is False):
                div_yield = None
            dados['div_yield'] = div_yield
        else:
            dados['roe'] = dados['pl'] = dados['pvp'] = None
            dados['receita'] = dados['lucro'] = dados['div_yield'] = None

        return dados

    except Exception as e:
        if tentativa < 3:
            time.sleep(3)
            return buscar_dados_bdr(bdr_ticker, ticker_original, tentativa + 1)
        print(f"   ⚠️  Erro: {str(e)[:60]}")
        return None

def main(inicio=None, fim=None):
    ws = conectar()
    if not ws:
        return

    linhas = ws.get_all_values()
    inicio = inicio or 1
    fim = fim or len(linhas)

    print("=" * 70)
    print(f"SCRAPER DE BDRs ({inicio}-{fim})")
    print("=" * 70)

    contador = 0
    ok_count = 0

    for idx, linha in enumerate(linhas[1:], 2):
        if not linha or not linha[0]:
            continue

        bdr_ticker = linha[0].strip().upper()
        contador += 1

        if contador < inicio or contador > fim:
            continue

        if bdr_ticker not in MAPA_TICKERS:
            print(f"[{contador:3d}] {bdr_ticker:8s}... SKIP (não mapeado)")
            continue

        ticker_original = MAPA_TICKERS[bdr_ticker]

        if ticker_original is None:
            print(f"[{contador:3d}] {bdr_ticker:8s}... SKIP (sem ticker público)")
            continue

        print(f"[{contador:3d}] {bdr_ticker:8s} -> {ticker_original:8s}...", end=" ", flush=True)

        dados = buscar_dados_bdr(bdr_ticker, ticker_original)

        if not dados:
            print("SKIP (erro)")
            continue

        try:
            # Colunas: A=BRD, B=Vl.Pg (manual, não mexer), C=Vl.Atu, D=ROE, E=P/L,
            # F=P/VP, G=Proporção (fora de escopo), H=Liquidez, I=Receita,
            # J=Lucro Líquido, K=12M, L=%Div
            ws.update(range_name=f'C{idx}:F{idx}', values=[[
                round(dados['vl_atu'], 2) if dados['vl_atu'] else '',
                round(dados['roe'] * 100, 2) if dados['roe'] else '',
                round(dados['pl'], 2) if dados['pl'] else '',
                round(dados['pvp'], 2) if dados['pvp'] else ''
            ]])
            ws.update(range_name=f'H{idx}:L{idx}', values=[[
                dados['liquidez'] if dados['liquidez'] else '',
                round(dados['receita'], 0) if dados['receita'] else '',
                round(dados['lucro'], 0) if dados['lucro'] else '',
                dados['var_12m'] if dados['var_12m'] is not None else '',
                round(dados['div_yield'], 2) if dados['div_yield'] else ''
            ]])
            print("OK")
            ok_count += 1
        except Exception as e:
            print(f"ERR: {str(e)[:40]}")

        time.sleep(1.5)

    print("\n" + "=" * 70)
    print(f"CONCLUIDO! {ok_count}/{contador} atualizados")
    print("=" * 70)

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
