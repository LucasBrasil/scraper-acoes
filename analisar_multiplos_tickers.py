#!/usr/bin/env python3
import gspread
from google.oauth2.service_account import Credentials
import json
import os

SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]

def conectar():
    try:
        # Tentar variáveis de ambiente primeiro
        spreadsheet_id = os.environ.get('SPREADSHEET_ID')
        if spreadsheet_id and os.environ.get('GOOGLE_CREDENTIALS'):
            sa_json = json.loads(os.environ.get('GOOGLE_CREDENTIALS'))
            creds = Credentials.from_service_account_info(sa_json, scopes=SCOPES)
        else:
            # Tentar credentials.json
            creds = Credentials.from_service_account_file('credentials.json', scopes=SCOPES)
            # Para spreadsheet_id, tentar ler de .env ou variável
            spreadsheet_id = os.environ.get('SPREADSHEET_ID')
            if not spreadsheet_id:
                print("Erro: SPREADSHEET_ID não configurado")
                return None

        client = gspread.authorize(creds)
        return client.open_by_key(spreadsheet_id)
    except Exception as e:
        print(f"Erro conexao: {e}")
        return None

def analisar_tickers(tickers_lista):
    spreadsheet = conectar()
    if not spreadsheet:
        return

    try:
        ws_dados = spreadsheet.worksheet("Dados")
        ws_regras = spreadsheet.worksheet("Regras")
        ws_bancos = spreadsheet.worksheet("Bancos")
    except:
        print("Erro ao acessar abas")
        return

    # Buscar dados
    dados = ws_dados.get_all_values()
    regras = ws_regras.get_all_values()
    bancos_data = ws_bancos.get_all_values()
    lista_bancos = [b[0].upper() for b in bancos_data[1:] if b and b[0]]

    # Mapear colunas: A=0, B=1, C=2, D=3, E=4, F=5, G=6, H=7, I=8, J=9, K=10, L=11
    # E=ROE, F=Marg, G=Result, H=Osc, I=Div, J=P/VP, B=P/L, C=Lucro, L=Ativo

    def pontuar(valor, linha_regra_idx):
        """Pontua baseado nas regras"""
        if linha_regra_idx >= len(regras):
            return 0

        regra = regras[linha_regra_idx]
        if len(regra) < 4:
            return 0

        # Faixas: B,C=score1 | E,F=score2 | H,I=score3 | K,L=score4 | N,O=score5
        faixas = []
        for col_start in [1, 4, 7, 10, 13]:  # B, E, H, K, N
            if col_start < len(regra) and col_start + 2 < len(regra):
                try:
                    min_v = float(regra[col_start]) if regra[col_start] else -999
                    max_v = float(regra[col_start + 1]) if regra[col_start + 1] else 999
                    pts = int(regra[col_start + 2]) if regra[col_start + 2] else 0
                    faixas.append((min_v, max_v, pts))
                except:
                    pass

        for min_v, max_v, pts in faixas:
            if min_v <= valor < max_v:
                return pts
        return 0

    print("\n" + "="*120)
    print("ANÁLISE DE COMPOSIÇÃO DE NOTAS")
    print("="*120)

    for ticker_busca in tickers_lista:
        ticker_busca = ticker_busca.upper()

        # Encontrar ticker
        row_idx = None
        for idx, row in enumerate(dados[1:], 1):
            if row and row[0].upper() == ticker_busca:
                row_idx = idx + 1
                break

        if not row_idx:
            print(f"\n❌ {ticker_busca}: Não encontrado")
            continue

        row = dados[row_idx - 1]

        # Extrair valores (ajustado para os índices corretos)
        try:
            pl = float(row[1]) if len(row) > 1 and row[1] else 0
            lucro = float(row[2]) if len(row) > 2 and row[2] else 0
            roe = float(row[4]) if len(row) > 4 and row[4] else 0
            marg = float(row[5]) if len(row) > 5 and row[5] else 0
            result = float(row[6]) if len(row) > 6 and row[6] else 0
            osc = float(row[7]) if len(row) > 7 and row[7] else 0
            div = float(row[8]) if len(row) > 8 and row[8] else 0
            pvp = float(row[9]) if len(row) > 9 and row[9] else 0
            ativo = float(row[11]) if len(row) > 11 and row[11] else 0
        except:
            print(f"\n❌ {ticker_busca}: Erro ao extrair valores")
            continue

        eh_banco = ticker_busca in lista_bancos

        # Calcular pontuações
        pts_roe = pontuar(roe, 1)  # Regra linha 2 (índice 1)
        pts_marg = pontuar(marg, 2)  # Regra linha 3
        pts_result = pontuar(result, 3)  # Regra linha 4
        pts_osc = 1 if osc < 20 else -1  # Regra linha 5
        pts_div = pontuar(div, 5)  # Regra linha 6
        pts_pvp = pontuar(pvp, 6)  # Regra linha 7
        pts_pl = pontuar(pl, 7)  # Regra linha 8
        pts_lucro = pontuar(lucro, 8)  # Regra linha 9
        pts_ativo = pontuar(ativo, 9)  # Regra linha 10

        # Calcular total
        if eh_banco:
            total = pts_roe + pts_osc + pts_div + pts_pvp + pts_lucro + pts_ativo + 1
        else:
            total = pts_roe + pts_marg + pts_result + pts_osc + pts_div + pts_pvp + pts_pl + pts_lucro + pts_ativo

        nota_final = max(0, min(10, total))

        # Exibir
        print(f"\n{'─'*120}")
        print(f"📊 {ticker_busca:8s} | {'BANCO' if eh_banco else 'AÇÃO ':6s} | Nota: {nota_final:5.1f}")
        print(f"{'─'*120}")
        print(f"  ROE     {roe:>8.2f}  →  {pts_roe:>3} pts  |  Marg    {marg:>8.2f}  →  {pts_marg:>3} pts  |  Result  {result:>8.2f}  →  {pts_result:>3} pts")
        print(f"  Osc     {osc:>8.2f}  →  {pts_osc:>3} pts  |  Div     {div:>8.2f}  →  {pts_div:>3} pts  |  P/VP    {pvp:>8.2f}  →  {pts_pvp:>3} pts")
        if not eh_banco:
            print(f"  P/L     {pl:>8.2f}  →  {pts_pl:>3} pts  |  Lucro   {lucro:>12.0f}  →  {pts_lucro:>3} pts  |  Ativo   {ativo:>12.0f}  →  {pts_ativo:>3} pts")
        else:
            print(f"  Lucro   {lucro:>12.0f}  →  {pts_lucro:>3} pts  |  Ativo   {ativo:>12.0f}  →  {pts_ativo:>3} pts  |  Bônus Banco → +1 pt")
        print(f"{'─'*120}")
        print(f"  TOTAL: {total:>3} pts  →  NOTA FINAL (cap 0-10): {nota_final:.1f}")

    print("\n" + "="*120 + "\n")

if __name__ == "__main__":
    tickers = [
        'EQPA3', 'ALUP3', 'ITSA4', 'ITUB3', 'SANB4', 'BBDC4',
        'ABCB4', 'BRSR6', 'BEES3', 'BNBR3', 'BPAC11', 'BPAC3',
        'BBAS3', 'BAZA3', 'BGIP4', 'BSLI4'
    ]
    analisar_tickers(tickers)
