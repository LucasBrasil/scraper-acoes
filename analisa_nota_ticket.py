#!/usr/bin/env python3
import gspread
from google.oauth2.service_account import Credentials
import json
import os

WORKSHEET_NAME = "Dados"
SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]

def conectar():
    try:
        spreadsheet_id = os.environ.get('SPREADSHEET_ID')
        if not spreadsheet_id:
            print("ERRO: SPREADSHEET_ID nao configurado!")
            return None
        sa_json = json.loads(os.environ.get('GOOGLE_CREDENTIALS'))
        creds = Credentials.from_service_account_info(sa_json, scopes=SCOPES)
        client = gspread.authorize(creds)
        return client.open_by_key(spreadsheet_id)
    except Exception as e:
        print(f"Erro conexao: {e}")
        return None

def extrair_numero(valor):
    """Remove % e converte para float"""
    if not valor:
        return 0.0
    valor = str(valor).replace('%', '').replace(',', '.').strip()
    try:
        return float(valor)
    except:
        return 0.0

def calcular_score_metrica(valor, ranges):
    """
    Calcula o score baseado nas faixas
    ranges = [(min, max, score), ...]
    """
    for min_val, max_val, score in ranges:
        if min_val <= valor <= max_val:
            return score
    return 0

def main():
    spreadsheet = conectar()
    if not spreadsheet:
        return

    ws = spreadsheet.worksheet(WORKSHEET_NAME)

    # Procurar por GEPA4
    valores = ws.get_all_values()
    linha_gepa4 = None
    idx_linha = 0

    for i, linha in enumerate(valores):
        if linha and linha[0] == 'GEPA4':
            linha_gepa4 = linha
            idx_linha = i + 1
            break

    if not linha_gepa4:
        print("❌ GEPA4 não encontrado na planilha")
        return

    print("=" * 80)
    print(f"📊 ANÁLISE DE NOTA - GEPA4 (Linha {idx_linha})")
    print("=" * 80)

    # Extrair valores
    ticker = linha_gepa4[0]
    pl = extrair_numero(linha_gepa4[1]) if len(linha_gepa4) > 1 else 0
    lucro = extrair_numero(linha_gepa4[2]) if len(linha_gepa4) > 2 else 0
    preco = extrair_numero(linha_gepa4[3]) if len(linha_gepa4) > 3 else 0
    roe = extrair_numero(linha_gepa4[4]) if len(linha_gepa4) > 4 else 0
    marg = extrair_numero(linha_gepa4[5]) if len(linha_gepa4) > 5 else 0
    result = extrair_numero(linha_gepa4[6]) if len(linha_gepa4) > 6 else 0
    osc = extrair_numero(linha_gepa4[7]) if len(linha_gepa4) > 7 else 0
    div = extrair_numero(linha_gepa4[8]) if len(linha_gepa4) > 8 else 0
    pvp = extrair_numero(linha_gepa4[9]) if len(linha_gepa4) > 9 else 0
    nota = extrair_numero(linha_gepa4[10]) if len(linha_gepa4) > 10 else 0

    print(f"\n📈 DADOS BRUTOS:\n")
    print(f"  Ticker:        {ticker}")
    print(f"  P/L:           {pl:.2f}")
    print(f"  Lucro Liq:     {lucro:,.0f}")
    print(f"  Preço:         {preco:.2f}")
    print(f"  ROE%:          {roe:.2f}%")
    print(f"  Marg%:         {marg:.2f}%")
    print(f"  Result 12M%:   {result:.2f}%")
    print(f"  Osc 12M%:      {osc:.2f}%")
    print(f"  %Div:          {div:.2f}%")
    print(f"  P/VP:          {pvp:.2f}")
    print(f"  Nota Final:    {nota:.2f}")

    # Verificar se é banco
    print(f"\n🏦 VERIFICAÇÃO:\n")

    try:
        ws_bancos = spreadsheet.worksheet("Bancos")
        bancos_valores = ws_bancos.get_all_values()
        bancos = [b[0].strip().upper() for b in bancos_valores if b]
        eh_banco = ticker in bancos
        print(f"  É Banco?       {'SIM ✅' if eh_banco else 'NÃO ❌'}")
    except:
        eh_banco = False
        print(f"  É Banco?       (aba Bancos não encontrada)")

    # Calcular scores com regras ATUAIS (antes da alteração)
    print(f"\n📋 CÁLCULO COM REGRAS ATUAIS:\n")

    # Regras atuais (revisadas)
    score_roe = calcular_score_metrica(roe, [(-999, 0, -3), (0, 10, 0), (10, 15, 1), (15, 999, 2)])
    score_marg = calcular_score_metrica(marg, [(-999, 0, -2), (0, 10, 0), (10, 20, 1), (20, 999, 2)])
    score_result = calcular_score_metrica(result, [(-999, 0, -3), (0, 10, 0), (10, 20, 1), (20, 999, 2)])
    score_osc = calcular_score_metrica(osc, [(-999, -20, 1), (-20, 20, 0), (20, 999, -1)])
    score_div = calcular_score_metrica(div, [(0, 2, -1), (2, 5, 1), (5, 999, 2)])
    score_pvp = calcular_score_metrica(pvp, [(-999, 0, -1), (0, 1, 3), (1, 2, 0), (2, 3, -1), (3, 999, -2)])
    score_pl = calcular_score_metrica(pl, [(-999, 0, -1), (0, 5, 1), (5, 10, 0), (10, 999, -1)])

    print(f"  ROE ({roe:.2f}%):        {score_roe:+.0f}")
    print(f"  Marg ({marg:.2f}%):       {score_marg:+.0f}")
    print(f"  Result ({result:.2f}%):  {score_result:+.0f}")
    print(f"  Osc ({osc:.2f}%):       {score_osc:+.0f}")
    print(f"  Div ({div:.2f}%):       {score_div:+.0f}")
    print(f"  P/VP ({pvp:.2f}):       {score_pvp:+.0f}")
    print(f"  P/L ({pl:.2f}):        {score_pl:+.0f}")

    if eh_banco:
        total_antes = score_roe + score_osc + score_div + score_pvp + 2
        print(f"\n  BANCO: ROE + Osc + Div + PVP + 2")
    else:
        total_antes = score_roe + score_marg + score_result + score_osc + score_div + score_pvp
        print(f"\n  OUTROS: ROE + Marg + Result + Osc + Div + PVP")

    print(f"  Total (sem MIN): {total_antes:.0f}")
    print(f"  Total (com MIN 10): {min(10, total_antes):.0f}")

    # Calcular com regras NOVAS (0-10)
    print(f"\n📊 CÁLCULO COM REGRAS NOVAS (0-10):\n")

    score_roe_novo = calcular_score_metrica(roe, [(-999, 10, 0), (10, 15, 1), (15, 20, 2), (20, 999, 3)])
    score_marg_novo = calcular_score_metrica(marg, [(-999, 5, 0), (5, 15, 1), (15, 999, 2)])
    score_result_novo = calcular_score_metrica(result, [(-999, 5, 0), (5, 15, 1), (15, 999, 2)])
    score_osc_novo = calcular_score_metrica(osc, [(-999, -20, 0), (-20, 20, 1), (20, 999, 0)])
    score_div_novo = calcular_score_metrica(div, [(0, 2, 0), (2, 5, 1), (5, 999, 2)])
    score_pvp_novo = calcular_score_metrica(pvp, [(-999, 0, 0), (0, 1, 2), (1, 2, 1), (2, 999, 0)])
    score_pl_novo = calcular_score_metrica(pl, [(-999, 5, 0), (5, 10, 1), (10, 999, 0)])

    print(f"  ROE ({roe:.2f}%):        {score_roe_novo:.0f}")
    print(f"  Marg ({marg:.2f}%):       {score_marg_novo:.0f}")
    print(f"  Result ({result:.2f}%):  {score_result_novo:.0f}")
    print(f"  Osc ({osc:.2f}%):       {score_osc_novo:.0f}")
    print(f"  Div ({div:.2f}%):       {score_div_novo:.0f}")
    print(f"  P/VP ({pvp:.2f}):       {score_pvp_novo:.0f}")
    print(f"  P/L ({pl:.2f}):        {score_pl_novo:.0f}")

    if eh_banco:
        total_novo = score_roe_novo + score_osc_novo + score_div_novo + score_pvp_novo + 1
        print(f"\n  BANCO: ROE + Osc + Div + PVP + 1")
    else:
        total_novo = score_roe_novo + score_marg_novo + score_result_novo + score_osc_novo + score_div_novo + score_pvp_novo + score_pl_novo
        print(f"\n  OUTROS: ROE + Marg + Result + Osc + Div + PVP + P/L")

    print(f"  Total: {total_novo:.0f}")
    print(f"  Total (com MIN 10): {min(10, total_novo):.0f}")

    print("\n" + "=" * 80)
    print(f"📌 COMPARAÇÃO:\n")
    print(f"  Regras Atuais:    {min(10, total_antes):.0f} pontos")
    print(f"  Regras Novas:     {min(10, total_novo):.0f} pontos")
    print(f"  Diferença:        {min(10, total_novo) - min(10, total_antes):+.0f} pontos")
    print("=" * 80)

if __name__ == "__main__":
    main()
