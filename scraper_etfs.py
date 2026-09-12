#!/usr/bin/env python3
"""
Scraper de ETFs.
Fontes:
- Status Invest: Taxa de administração, Patrimônio líquido, Liquidez média diária
- yfinance: Retornos (12M, 3A, 5A, 10A) calculados via histórico de preços
  (total return, incluindo dividendos) e DY (dividend yield)

"Nº Ativos" fica de fora: não há fonte pública confiável e uniforme
(o conceito é ambíguo entre ETFs - ex: IVVB11 investe em 1 fundo
espelho americano, enquanto SMAL11 replica ~90 ações).
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
from yf_utils import yf_com_timeout, YFTimeout

WORKSHEET_NAME = "Dados ETFs"
SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]

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
    """Converte '0,24' ou '7.218.651.551' para float"""
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
            info = yf_com_timeout(lambda: yf.Ticker(f"{ticker}.SA").info)
            preco = info.get('currentPrice') or info.get('regularMarketPrice')
            if preco:
                ws.update(range_name=f'B{idx}', values=[[round(preco, 2)]])
                print(f"(Vl.Atu via yfinance: {round(preco, 2)}) ", end="")
    except YFTimeout:
        print("(yfinance timeout p/ Vl.Atu) ", end="")
    except Exception as e:
        print(f"(aviso Vl.Atu: {str(e)[:40]}) ", end="")

def buscar_status_invest(ticker, tentativa=1):
    try:
        url = f"https://statusinvest.com.br/etfs/{ticker.lower()}"
        r = requests.get(url, headers=HEADERS_BR, timeout=15)
        if r.status_code != 200:
            return None
        html = r.text

        m_taxa = re.search(
            r'(?:adm\.|administração)</span>\s*</span>\s*<strong class="value">([\d,]+)\s*%',
            html
        )
        m_patrim = re.search(
            r'Patrimônio líquido</span>.*?<strong class="value">([\d.,]+)</strong>',
            html, re.DOTALL
        )
        m_liquidez = re.search(
            r'Liquidez média diária</span>.*?<strong class="value">([\d.,]+)</strong>',
            html, re.DOTALL
        )

        return {
            'taxa_adm': num_br(m_taxa.group(1)) if m_taxa else None,
            'patrim_liquido': num_br(m_patrim.group(1)) if m_patrim else None,
            'vol_diario': num_br(m_liquidez.group(1)) if m_liquidez else None,
        }
    except requests.exceptions.Timeout:
        if tentativa < 3:
            time.sleep(5)
            return buscar_status_invest(ticker, tentativa + 1)
        return None
    except Exception as e:
        print(f"   ⚠️  Erro Status Invest: {str(e)[:60]}")
        return None

def buscar_retorno_periodo(hist, anos):
    """
    Retorno total (preço + dividendos reinvestidos) para N anos, usando
    o histórico já ajustado (Close com auto_adjust=True embute dividendos).
    Retorna None se o ETF não tem histórico suficiente para o período
    completo - preferimos deixar vazio a calcular "retorno desde o início"
    e apresentá-lo como se fosse "retorno 12M/3A/5A/10A".
    """
    if hist.empty:
        return None
    dias = int(anos * 252)  # dias úteis aproximados
    # margem de 5% para tolerar feriados/dias sem pregão
    if len(hist) < dias * 0.95:
        return None
    idx_ini = len(hist) - dias - 1

    preco_ini = hist['Close'].iloc[idx_ini]
    preco_fim = hist['Close'].iloc[-1]
    if not preco_ini:
        return None
    return ((preco_fim - preco_ini) / preco_ini) * 100

def buscar_retornos_e_dy(ticker):
    try:
        t = yf.Ticker(f"{ticker}.SA")
        # auto_adjust=True (padrão): Close já embute dividendos reinvestidos,
        # o que é exatamente o que queremos para "retorno total"
        hist = yf_com_timeout(lambda: t.history(period="10y"))
        if hist.empty:
            return None

        ret_12m = buscar_retorno_periodo(hist, 1)
        ret_3a = buscar_retorno_periodo(hist, 3)
        ret_5a = buscar_retorno_periodo(hist, 5)
        ret_10a = buscar_retorno_periodo(hist, 10)

        info = yf_com_timeout(lambda: t.info)
        # TODO: validar o formato real (percentual puro vs fração) assim que
        # possível testar com dados reais - não aplicar heurística de escala
        # aqui, pois um DY legitimamente baixo (<1%) seria "corrigido" errado
        dy = info.get('yield') or info.get('trailingAnnualDividendYield')

        return {
            'ret_12m': ret_12m,
            'ret_3a': ret_3a,
            'ret_5a': ret_5a,
            'ret_10a': ret_10a,
            'dy': dy,
        }
    except YFTimeout:
        print("   ⚠️  yfinance timeout")
        return None
    except Exception as e:
        print(f"   ⚠️  Erro yfinance: {str(e)[:60]}")
        return None

def main(inicio=None, fim=None):
    ws = conectar()
    if not ws:
        return

    linhas = ws.get_all_values()
    inicio = inicio or 1
    fim = fim or len(linhas)

    print("=" * 70)
    print(f"SCRAPER DE ETFs ({inicio}-{fim})")
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

        si = buscar_status_invest(ticker)
        retornos = buscar_retornos_e_dy(ticker)
        garantir_vl_atu(ws, idx, ticker)

        try:
            # Colunas: A=ETF, B=Vl.Atu (GOOGLEFINANCE, com fallback), C=Tx.Admin,
            # D=Pat.Liq., E=Vol.Diário, F=Nº Ativos (fora de escopo), G=Ret.12M,
            # H=Ret.3A, I=Ret.5A, J=Ret.10A, K=DY
            ws.update(range_name=f'C{idx}:E{idx}', values=[[
                si['taxa_adm'] if si and si['taxa_adm'] is not None else '',
                round(si['patrim_liquido'], 0) if si and si['patrim_liquido'] is not None else '',
                round(si['vol_diario'], 0) if si and si['vol_diario'] is not None else '',
            ]])
            ws.update(range_name=f'G{idx}:K{idx}', values=[[
                round(retornos['ret_12m'], 2) if retornos and retornos['ret_12m'] is not None else '',
                round(retornos['ret_3a'], 2) if retornos and retornos['ret_3a'] is not None else '',
                round(retornos['ret_5a'], 2) if retornos and retornos['ret_5a'] is not None else '',
                round(retornos['ret_10a'], 2) if retornos and retornos['ret_10a'] is not None else '',
                round(retornos['dy'], 2) if retornos and retornos['dy'] is not None else '',
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
