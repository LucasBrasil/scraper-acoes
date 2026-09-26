#!/usr/bin/env python3
import gspread
from google.oauth2.service_account import Credentials

def analisar_ticker(ticker_nome):
    # Conectar ao Google Sheets
    scopes = ['https://www.googleapis.com/auth/spreadsheets']
    creds = Credentials.from_service_account_file('credentials.json', scopes=scopes)
    client = gspread.authorize(creds)

    sheet = client.open('Carteira Atualizada')
    ws_dados = sheet.worksheet('Dados')
    ws_bancos = sheet.worksheet('Bancos')

    # Buscar dados
    dados = ws_dados.get_all_values()
    bancos = ws_bancos.get_all_values()
    lista_bancos = [b[0] for b in bancos[1:] if b]

    # Encontrar ticker
    gepa4_row = None
    for i, row in enumerate(dados):
        if row[0] == ticker_nome:
            gepa4_row = row
            break

    if not gepa4_row:
        print(f"{ticker_nome} não encontrado!")
        return

    # Extrair valores
    ticker = gepa4_row[0]
    pl = float(gepa4_row[1]) if gepa4_row[1] else 0
    lucro = float(gepa4_row[2]) if gepa4_row[2] else 0
    roe = float(gepa4_row[4]) if gepa4_row[4] else 0
    marg = float(gepa4_row[5]) if gepa4_row[5] else 0
    result = float(gepa4_row[6]) if gepa4_row[6] else 0
    osc = float(gepa4_row[7]) if gepa4_row[7] else 0
    div = float(gepa4_row[8]) if gepa4_row[8] else 0
    pvp = float(gepa4_row[9]) if gepa4_row[9] else 0
    ativo = float(gepa4_row[11]) if len(gepa4_row) > 11 and gepa4_row[11] else 0

    # Verificar se é banco
    eh_banco = ticker in lista_bancos

    print(f"\n{'='*60}")
    print(f"ANÁLISE DE PONTUAÇÃO: {ticker}")
    print(f"{'='*60}")
    print(f"\nDados brutos:")
    print(f"  P/L (B):      {pl}")
    print(f"  Lucro (C):    {lucro}")
    print(f"  ROE (E):      {roe}")
    print(f"  Marg (F):     {marg}")
    print(f"  Result (G):   {result}")
    print(f"  Osc (H):      {osc}")
    print(f"  Div (I):      {div}")
    print(f"  P/VP (J):     {pvp}")
    print(f"  Ativo (L):    {ativo}")
    print(f"  É Banco?:     {eh_banco}")

    # Calcular pontuações
    def pontuar(valor, faixas):
        """faixas: [(min, max, pontos), ...]"""
        for min_v, max_v, pts in faixas:
            if min_v <= valor < max_v:
                return pts
        return 0

    # Regras validadas
    pts_roe = pontuar(roe, [(-999, 0, -3), (0, 10, 0), (10, 15, 1), (15, 20, 2), (20, 999, 3)])
    pts_marg = pontuar(marg, [(-999, 0, -2), (0, 5, 0), (5, 10, 1), (10, 20, 2), (20, 999, 3)])
    pts_result = pontuar(result, [(-999, 0, -3), (0, 5, 0), (5, 10, 1), (10, 20, 2), (20, 999, 3)])
    pts_osc = 1 if osc < 20 else -1
    pts_div = pontuar(div, [(0, 1, 0), (1, 5, 1), (5, 10, 2), (10, 999, 3)])
    pts_pl = pontuar(pl, [(-999, 0, -1), (0, 5, 1), (5, 10, 0), (10, 999, -1)])
    pts_lucro = pontuar(lucro, [(-999, -1000000, -2), (-1000000, 0, -1), (0, 999, 0)])
    pts_ativo = pontuar(ativo, [(-999, 0, -1), (0, 100000000, 0), (100000000, 1000000000, 1), (1000000000, 999999999, 2)])

    # P/VP (com lógica condicional)
    if roe > 20:
        if pvp >= 1:
            pts_pvp = 0 if pvp < 3 else -2
        else:
            pts_pvp = 2
    else:
        pts_pvp = pontuar(pvp, [(-999, 0, -1), (0, 1, 2), (1, 2, 1), (2, 3, 0), (3, 999, -2)])

    print(f"\n{'PONTUAÇÃO POR MÉTRICA':^60}")
    print(f"{'-'*60}")
    print(f"  ROE     {roe:>8.2f} → {pts_roe:>3} pontos")

    if not eh_banco:
        print(f"  Marg    {marg:>8.2f} → {pts_marg:>3} pontos")
        print(f"  Result  {result:>8.2f} → {pts_result:>3} pontos")

    print(f"  Osc     {osc:>8.2f} → {pts_osc:>3} pontos")
    print(f"  Div     {div:>8.2f} → {pts_div:>3} pontos")

    if roe > 20:
        print(f"  P/VP    {pvp:>8.2f} → {pts_pvp:>3} pontos (ROE>20: lógica especial)")
    else:
        print(f"  P/VP    {pvp:>8.2f} → {pts_pvp:>3} pontos")

    if not eh_banco:
        print(f"  P/L     {pl:>8.2f} → {pts_pl:>3} pontos")

    print(f"  Lucro   {lucro:>8.0f} → {pts_lucro:>3} pontos")
    print(f"  Ativo   {ativo:>8.0f} → {pts_ativo:>3} pontos")

    if eh_banco:
        print(f"  Bônus Banco:     → {1:>3} pontos")
        total = pts_roe + pts_osc + pts_div + pts_pvp + pts_lucro + pts_ativo + 1
    else:
        total = pts_roe + pts_marg + pts_result + pts_osc + pts_div + pts_pvp + pts_pl + pts_lucro + pts_ativo

    print(f"{'-'*60}")
    print(f"{'TOTAL SEM CAP':>45} {total:>3} pontos")

    nota_final = min(10, max(-10, total))
    print(f"{'NOTA FINAL (MIN 10)':>45} {nota_final:>3} pontos")
    print(f"{'='*60}\n")

# Usar
if __name__ == "__main__":
    analisar_ticker("GEPA4")
