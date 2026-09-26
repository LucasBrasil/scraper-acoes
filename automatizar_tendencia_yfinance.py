#!/usr/bin/env python3
import gspread
from google.oauth2.service_account import Credentials
import yfinance as yf
import json
import os
from datetime import datetime, timedelta
import time

SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]

def conectar():
    spreadsheet_id = os.environ.get('SPREADSHEET_ID')
    sa_json = json.loads(os.environ.get('GOOGLE_CREDENTIALS'))
    creds = Credentials.from_service_account_info(sa_json, scopes=SCOPES)
    client = gspread.authorize(creds)
    return client.open_by_key(spreadsheet_id)

def buscar_preco(ticker, dias_atras):
    """Busca preço de fechamento de uma ação em uma data específica"""
    try:
        data_ini = datetime.now() - timedelta(days=dias_atras+5)
        data_fim = datetime.now() - timedelta(days=dias_atras-1)

        stock = yf.Ticker(f"{ticker}.SA")
        hist = stock.history(start=data_ini, end=data_fim)

        if hist.empty:
            return None

        # Pegar o preço de fechamento mais recente
        preco = hist['Close'].iloc[-1]
        return float(preco)
    except Exception as e:
        print(f"   ⚠️  Erro ao buscar {ticker}: {e}")
        return None

def calcular_tendencia(ticker):
    """Calcula se está subindo ou caindo nos períodos 7, 30, 122 dias"""
    try:
        # Preço atual
        preco_hoje = buscar_preco(ticker, 0)
        if not preco_hoje:
            return None, None, None

        # Preços históricos
        preco_7d = buscar_preco(ticker, 7)
        preco_30d = buscar_preco(ticker, 30)
        preco_122d = buscar_preco(ticker, 122)

        # Comparações
        tendencia_7d = "Subindo" if preco_hoje > preco_7d else "Caindo" if preco_7d else None
        tendencia_30d = "Subindo" if preco_hoje > preco_30d else "Caindo" if preco_30d else None
        tendencia_122d = "Subindo" if preco_hoje > preco_122d else "Caindo" if preco_122d else None

        return tendencia_7d, tendencia_30d, tendencia_122d

    except Exception as e:
        print(f"   ❌ Erro ao calcular tendência de {ticker}: {e}")
        return None, None, None

def automatizar():
    ss = conectar()
    ws = ss.worksheet('Acoes')

    dados = ws.get_all_values()
    ultima_linha = len(dados)

    print("📊 Automatizando leitura de tendências com yfinance...\n")

    # Coletar dados de todos os tickers
    updates = []
    tickers_processados = 0
    erros = 0

    for row in range(2, min(ultima_linha + 1, 100)):  # Limitar a 100 para não sobrecarregar
        try:
            ticker = ws.cell(row, 1).value

            # Pular cabeçalhos e linhas vazias
            if not ticker or ":" in str(ticker) or len(str(ticker)) < 4:
                continue

            ticker = ticker.strip().upper()

            print(f"[{tickers_processados + 1}] {ticker}...", end=" ", flush=True)

            # Calcular tendências
            tend_7d, tend_30d, tend_122d = calcular_tendencia(ticker)

            if tend_7d:
                updates.append({'range': f'AQ{row}', 'values': [[tend_7d]]})
                updates.append({'range': f'AR{row}', 'values': [[tend_30d]]})
                updates.append({'range': f'AS{row}', 'values': [[tend_122d]]})
                print(f"✅ {tend_7d}/{tend_30d}/{tend_122d}")
                tickers_processados += 1
            else:
                print(f"❌ Sem dados")
                erros += 1

            # Aguardar para não sobrecarregar
            time.sleep(0.5)

        except Exception as e:
            print(f"❌ Erro: {e}")
            erros += 1

    # Gravar em batch
    if updates:
        print(f"\n📝 Gravando {len(updates)} valores na planilha...")

        batch_size = 150
        for i in range(0, len(updates), batch_size):
            batch = updates[i:i+batch_size]
            try:
                ws.batch_update(batch, value_input_option='RAW')
                print(f"   ✅ Batch {i//batch_size + 1}")
            except Exception as e:
                print(f"   ❌ Erro: {e}")

    print(f"\n✅ Concluído!")
    print(f"   Tickers processados: {tickers_processados}")
    print(f"   Erros: {erros}")
    print(f"   Total gravado: {len(updates)//3} linhas")

if __name__ == "__main__":
    automatizar()
