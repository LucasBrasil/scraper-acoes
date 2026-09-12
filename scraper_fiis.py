#!/usr/bin/env python3
"""
Scraper de FIIs.
Fontes:
- Fundamentus: VPA, Patrim Líquido, Cotas emitidas, DY 12M, Dividendos 12M, P/VP, Qtd Ativos
- Status Invest: Último rendimento (mensal)
- investidor10: Taxa de administração
- yfinance: variação de preço 12M (para calcular Rent. = retorno total)
"""
import gspread
from google.oauth2.service_account import Credentials
import requests
import re
import json
import os
import sys
import time
import yfinance as yf

WORKSHEET_NAME = "Dados FIIs"
SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]

HEADERS_FUND = {"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120.0.0.0"}
HEADERS_BR = {
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

def num_br(txt):
    """Converte '166,43' ou '7.589.550.000' para float"""
    if not txt:
        return None
    txt = txt.replace('%', '').strip()
    txt = txt.replace('.', '').replace(',', '.')
    try:
        return float(txt)
    except:
        return None

def garantir_vl_atu(ws, idx, ticker):
    """
    Reescreve a fórmula GOOGLEFINANCE na coluna B; se após recalcular o
    valor continuar como erro (#N/A etc.), substitui por um número fixo
    vindo do yfinance como fallback.
    """
    try:
        ws.update(range_name=f'B{idx}', values=[[f'=GoogleFinance(A{idx},"price")']],
                  value_input_option='USER_ENTERED')
        time.sleep(2)
        valor = ws.acell(f'B{idx}').value

        valor_ok = False
        if valor:
            try:
                float(str(valor).replace(',', '.'))
                valor_ok = True
            except ValueError:
                valor_ok = False

        if not valor_ok:
            info = yf.Ticker(f"{ticker}.SA").info
            preco = info.get('currentPrice') or info.get('regularMarketPrice')
            if preco:
                ws.update(range_name=f'B{idx}', values=[[round(preco, 2)]])
                print(f"(Vl.Atu via yfinance: {round(preco, 2)}) ", end="")
    except Exception as e:
        print(f"(aviso Vl.Atu: {str(e)[:40]}) ", end="")

def buscar_fundamentus(ticker, tentativa=1):
    try:
        url = f"https://fundamentus.com.br/detalhes.php?papel={ticker}"
        r = requests.get(url, headers=HEADERS_FUND, timeout=45)
        if r.status_code != 200:
            return None
        html = r.text

        def campo(label):
            m = re.search(
                rf'<span class="txt">{re.escape(label)}</span></td>\s*<td class="data[^"]*"><span class="txt">([^<]+)</span>',
                html
            )
            return num_br(m.group(1)) if m else None

        return {
            'vpa': campo('VP/Cota'),
            'patrim_liquido': campo('Patrim Líquido'),
            'cotas': campo('Nro. Cotas'),
            'dy_12m': campo('Div. Yield'),
            'div_12m_cota': campo('Dividendo/cota'),
            'pvp': campo('P/VP'),
            'qtd_ativos': campo('Qtd imóveis') or campo('Qtd Unidades'),
        }
    except requests.exceptions.Timeout:
        if tentativa < 3:
            time.sleep(5)
            return buscar_fundamentus(ticker, tentativa + 1)
        return None
    except Exception as e:
        print(f"   ⚠️  Erro Fundamentus: {str(e)[:60]}")
        return None

def buscar_ultimo_rendimento(ticker, tentativa=1):
    try:
        url = f"https://statusinvest.com.br/fundos-imobiliarios/{ticker.lower()}"
        r = requests.get(url, headers=HEADERS_BR, timeout=15)
        if r.status_code != 200:
            return None
        m = re.search(
            r'Último rendimento.*?<strong class="value[^"]*">([\d,]+)</strong>',
            r.text, re.DOTALL
        )
        return num_br(m.group(1)) if m else None
    except requests.exceptions.Timeout:
        if tentativa < 2:
            time.sleep(3)
            return buscar_ultimo_rendimento(ticker, tentativa + 1)
        return None
    except Exception:
        return None

def buscar_taxa_administracao(ticker):
    try:
        url = f"https://investidor10.com.br/fiis/{ticker.lower()}/"
        r = requests.get(url, headers=HEADERS_BR, timeout=15)
        if r.status_code != 200:
            return None
        idx = r.text.lower().find("taxa de admin")
        if idx < 0:
            return None
        trecho = r.text[idx:idx + 300]
        m = re.search(r'([\d]+[.,]\d+)\s*%\s*a\.a', trecho)
        if not m:
            return None
        valor_txt = m.group(1)
        # Formato pode vir com ponto (1.15) ou vírgula (1,15) como decimal
        if ',' in valor_txt:
            valor_txt = valor_txt.replace('.', '').replace(',', '.')
        return float(valor_txt)
    except Exception:
        return None

def buscar_variacao_preco_12m(ticker):
    try:
        # auto_adjust=False: precisamos do preço NOMINAL real, não ajustado por
        # dividendos - caso contrário os dividendos seriam contados duas vezes
        # (uma vez embutidos no ajuste de preço, outra na soma manual em Rent.)
        hist = yf.Ticker(f"{ticker}.SA").history(period="1y", auto_adjust=False)
        if hist.empty or len(hist) < 2:
            return None
        preco_ini = hist['Close'].iloc[0]
        preco_fim = hist['Close'].iloc[-1]
        if not preco_ini:
            return None
        return {
            'var_pct': ((preco_fim - preco_ini) / preco_ini) * 100,
            'preco_ini': preco_ini,
        }
    except Exception:
        return None

def main(inicio=None, fim=None):
    ws = conectar()
    if not ws:
        return

    linhas = ws.get_all_values()
    inicio = inicio or 1
    fim = fim or len(linhas)

    print("=" * 70)
    print(f"SCRAPER DE FIIs ({inicio}-{fim})")
    print("=" * 70)

    contador = 0
    ok_count = 0

    for idx, linha in enumerate(linhas[1:], 2):
        if not linha or not linha[0]:
            continue

        ticker = linha[0].strip().upper()
        contador += 1

        if contador < inicio or contador > fim:
            continue

        print(f"[{contador:3d}] {ticker:8s}...", end=" ", flush=True)

        fund = buscar_fundamentus(ticker)
        if not fund:
            print("SKIP (Fundamentus falhou)")
            continue

        rendimento_mensal = buscar_ultimo_rendimento(ticker)
        taxa_adm = buscar_taxa_administracao(ticker)
        preco_info = buscar_variacao_preco_12m(ticker)

        # Rent. = retorno total 12M (variação de preço + dividendos recebidos / preço inicial)
        rent_total = None
        if preco_info and fund.get('div_12m_cota') is not None:
            var_preco_abs = preco_info['preco_ini'] * (preco_info['var_pct'] / 100)
            rent_total = ((var_preco_abs + fund['div_12m_cota']) / preco_info['preco_ini']) * 100
        elif preco_info:
            rent_total = preco_info['var_pct']

        # DY Mensal = último rendimento / cotação atual (usa preço mais recente do yfinance como proxy)
        dy_mensal = None
        try:
            preco_atual = yf.Ticker(f"{ticker}.SA").info.get('currentPrice') or yf.Ticker(f"{ticker}.SA").info.get('regularMarketPrice')
            if rendimento_mensal and preco_atual:
                dy_mensal = (rendimento_mensal / preco_atual) * 100
        except Exception:
            pass

        garantir_vl_atu(ws, idx, ticker)

        try:
            # Colunas: A=FII, B=Vl.Atu (GOOGLEFINANCE, com fallback via yfinance se der erro),
            # C=VPA, D=Patrim líquido, E=Cotas emitidas, F=Último rendimento mensal,
            # G=Taxa administração, H=Rent., I=DY 12M, J=%Div (DY mensal), K=P/VP, L=Qtd Ativos
            ws.update(range_name=f'C{idx}:L{idx}', values=[[
                fund['vpa'] if fund['vpa'] is not None else '',
                round(fund['patrim_liquido'], 0) if fund['patrim_liquido'] is not None else '',
                round(fund['cotas'], 0) if fund['cotas'] is not None else '',
                rendimento_mensal if rendimento_mensal is not None else '',
                taxa_adm if taxa_adm is not None else '',
                round(rent_total, 2) if rent_total is not None else '',
                fund['dy_12m'] if fund['dy_12m'] is not None else '',
                round(dy_mensal, 2) if dy_mensal is not None else '',
                fund['pvp'] if fund['pvp'] is not None else '',
                round(fund['qtd_ativos'], 0) if fund['qtd_ativos'] is not None else '',
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
