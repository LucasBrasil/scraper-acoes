#!/usr/bin/env python3
"""
Scraper de ETFs.
Fontes:
- etfsbrasil.com.br: Taxa de administração, Patrimônio líquido, Liquidez média diária
- yfinance: Retornos (12M, 3A, 5A) calculados via histórico de preços
  (total return, incluindo dividendos) e DY (dividend yield)

Colunas "Nº Ativos" e "Ret. 10 Anos" removidas da planilha pelo usuário
(sem fonte pública confiável e uniforme para a primeira).
"""
import gspread
from google.oauth2.service_account import Credentials
import requests
import re
import json
import os
import sys
import time
import math
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

def buscar_etfsbrasil(ticker, tentativa=1, debug=False):
    """
    Fonte: etfsbrasil.com.br. Trocado do Status Invest, que bloqueia (HTTP 403)
    requisições vindas de IPs de datacenter como o do GitHub Actions runner.
    """
    try:
        url = f"https://www.etfsbrasil.com.br/etfs/{ticker.lower()}"
        r = requests.get(url, headers=HEADERS_BR, timeout=15)
        if r.status_code != 200:
            if debug:
                print(f"\n   [debug] {ticker}: HTTP {r.status_code}, tamanho={len(r.text)}")
            return None
        html = r.text

        def campo(label):
            m = re.search(
                re.escape(label) + r'</div><div class="[^"]*__value">([^<]+)</div>',
                html
            )
            return m.group(1) if m else None

        def campo_com_comentario(label):
            # Alguns valores têm comentários HTML <!-- --> intercalados
            # (ex: "R$ 66,84<!-- --> <span...") antes do </div> de fechamento
            m = re.search(
                re.escape(label) + r'</div><div class="[^"]*__value">([^<]+)',
                html
            )
            return m.group(1) if m else None

        txt_patrim = campo('Patrimônio líquido (R$ MM)')
        txt_vol = campo_com_comentario('Negociação diária média')
        txt_taxa = campo('Taxa de administração total')

        if debug and not (txt_patrim and txt_vol and txt_taxa):
            bloqueado = any(s in html for s in ['Just a moment', 'cf-browser-verification', 'captcha', 'Access denied'])
            print(f"\n   [debug] {ticker}: HTTP 200, tamanho={len(html)}, "
                  f"patrim={bool(txt_patrim)} vol={bool(txt_vol)} taxa={bool(txt_taxa)}, "
                  f"sinais_bloqueio={bloqueado}")

        # Patrimônio e volume vêm em R$ milhões ("7.533,90" -> 7533900000 * ...)
        patrim = num_br(txt_patrim) if txt_patrim else None
        vol = num_br(txt_vol.replace('R$', '').strip()) if txt_vol else None
        taxa = num_br(txt_taxa) if txt_taxa else None

        return {
            'taxa_adm': taxa,
            'patrim_liquido': patrim * 1_000_000 if patrim is not None else None,
            'vol_diario': vol * 1_000_000 if vol is not None else None,
        }
    except requests.exceptions.Timeout:
        if tentativa < 3:
            time.sleep(5)
            return buscar_etfsbrasil(ticker, tentativa + 1, debug)
        if debug:
            print(f"\n   [debug] {ticker}: Timeout após {tentativa} tentativas")
        return None
    except Exception as e:
        print(f"   ⚠️  Erro etfsbrasil: {str(e)[:60]}")
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
    idx_ini = len(hist) - dias - 1
    if idx_ini < 0:
        # Não há histórico suficiente para o período completo
        return None

    preco_ini = hist['Close'].iloc[idx_ini]
    preco_fim = hist['Close'].iloc[-1]
    if not preco_ini or math.isnan(preco_ini) or math.isnan(preco_fim):
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
        # O candle do dia mais recente às vezes vem com Close=NaN (pregão
        # ainda em andamento / dado não fechado) - descarta linhas inválidas
        hist = hist[hist['Close'].notna()]
        if hist.empty:
            return None

        ret_12m = buscar_retorno_periodo(hist, 1)
        ret_3a = buscar_retorno_periodo(hist, 3)
        ret_5a = buscar_retorno_periodo(hist, 5)

        info = yf_com_timeout(lambda: t.info)
        # TODO: validar o formato real (percentual puro vs fração) assim que
        # possível testar com dados reais - não aplicar heurística de escala
        # aqui, pois um DY legitimamente baixo (<1%) seria "corrigido" errado
        dy = info.get('yield') or info.get('trailingAnnualDividendYield')

        return {
            'ret_12m': ret_12m,
            'ret_3a': ret_3a,
            'ret_5a': ret_5a,
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

        si = buscar_etfsbrasil(ticker, debug=True)
        retornos = buscar_retornos_e_dy(ticker)
        garantir_vl_atu(ws, idx, ticker)

        try:
            # Colunas: A=ETF, B=Vl.Atu (GOOGLEFINANCE, com fallback), C=Tx.Admin,
            # D=Pat.Liq., E=Vol.Diário, F=Ret.12M, G=Ret.3A, H=Ret.5A, I=DY
            # ("Nº Ativos" e "Ret.10A" removidos da planilha)
            ws.update(range_name=f'C{idx}:E{idx}', values=[[
                si['taxa_adm'] if si and si['taxa_adm'] is not None else '',
                round(si['patrim_liquido'], 0) if si and si['patrim_liquido'] is not None else '',
                round(si['vol_diario'], 0) if si and si['vol_diario'] is not None else '',
            ]])
            ws.update(range_name=f'F{idx}:I{idx}', values=[[
                round(retornos['ret_12m'], 2) if retornos and retornos['ret_12m'] is not None else '',
                round(retornos['ret_3a'], 2) if retornos and retornos['ret_3a'] is not None else '',
                round(retornos['ret_5a'], 2) if retornos and retornos['ret_5a'] is not None else '',
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
