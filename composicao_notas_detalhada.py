#!/usr/bin/env python3
import gspread
from google.oauth2.service_account import Credentials
import json
import os

SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]

def conectar():
    try:
        spreadsheet_id = os.environ.get('SPREADSHEET_ID')
        if spreadsheet_id and os.environ.get('GOOGLE_CREDENTIALS'):
            sa_json = json.loads(os.environ.get('GOOGLE_CREDENTIALS'))
            creds = Credentials.from_service_account_info(sa_json, scopes=SCOPES)
        else:
            creds = Credentials.from_service_account_file('credentials.json', scopes=SCOPES)
            spreadsheet_id = os.environ.get('SPREADSHEET_ID')
            if not spreadsheet_id:
                print("Erro: SPREADSHEET_ID não configurado")
                return None

        client = gspread.authorize(creds)
        return client.open_by_key(spreadsheet_id)
    except Exception as e:
        print(f"Erro conexao: {e}")
        return None

def analisar_tickers_composicao(tickers_lista):
    spreadsheet = conectar()
    if not spreadsheet:
        return

    try:
        ws_dados = spreadsheet.worksheet("Dados")
        ws_bancos = spreadsheet.worksheet("Bancos")
    except:
        print("Erro ao acessar abas")
        return

    # Buscar dados
    dados = ws_dados.get_all_values()
    bancos_data = ws_bancos.get_all_values()
    lista_bancos = [b[0].upper() for b in bancos_data[1:] if b and b[0]]

    # Colunas: AA=27, AB=28, AC=29, AD=30, AE=31, AF=32, AG=33, AH=34, AI=35
    # Em índices 0-based: 26, 27, 28, 29, 30, 31, 32, 33, 34

    print("\n" + "="*140)
    print("COMPOSIÇÃO DETALHADA DAS NOTAS (Colunas AA-AI)")
    print("="*140)
    print("\nColunas:")
    print("  AA = ROE         (pts ROE)")
    print("  AB = Marg        (pts Margem Líquida)")
    print("  AC = Result      (pts Resultado 12M)")
    print("  AD = Osc         (pts Oscilação 12M)")
    print("  AE = Div         (pts Dividend Yield)")
    print("  AF = P/VP        (pts Preço/Valor Patrimonial)")
    print("  AG = P/L         (pts Preço/Lucro)")
    print("  AH = Lucro       (pts Lucro Líquido)")
    print("  AI = Ativo       (pts Ativo Total)")
    print("="*140)

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

        # Extrair colunas AA-AI (índices 26-34)
        try:
            aa = float(row[26]) if len(row) > 26 and row[26] else 0  # ROE
            ab = float(row[27]) if len(row) > 27 and row[27] else 0  # Marg
            ac = float(row[28]) if len(row) > 28 and row[28] else 0  # Result
            ad = float(row[29]) if len(row) > 29 and row[29] else 0  # Osc
            ae = float(row[30]) if len(row) > 30 and row[30] else 0  # Div
            af = float(row[31]) if len(row) > 31 and row[31] else 0  # P/VP
            ag = float(row[32]) if len(row) > 32 and row[32] else 0  # P/L
            ah = float(row[33]) if len(row) > 33 and row[33] else 0  # Lucro
            ai = float(row[34]) if len(row) > 34 and row[34] else 0  # Ativo
            nota = float(row[10]) if len(row) > 10 and row[10] else 0  # Coluna K (Nota)
        except:
            print(f"\n❌ {ticker_busca}: Erro ao extrair colunas")
            continue

        eh_banco = ticker_busca in lista_bancos

        # Calcular total
        if eh_banco:
            total = aa + ad + ae + af + ah + ai + 1
            print(f"\n{'─'*140}")
            print(f"🏦 {ticker_busca:8s} | BANCO | Nota: {nota:5.1f}")
            print(f"{'─'*140}")
            print(f"  AA(ROE) {aa:>5.0f}  +  AD(Osc) {ad:>5.0f}  +  AE(Div) {ae:>5.0f}  +  AF(P/VP) {af:>5.0f}  +  AH(Lucro) {ah:>5.0f}  +  AI(Ativo) {ai:>5.0f}  +  BÔNUS +1")
            print(f"{'─'*140}")
            print(f"  Subtotal: {aa} + {ad} + {ae} + {af} + {ah} + {ai} = {aa+ad+ae+af+ah+ai} + 1(bônus) = {total} → NOTA FINAL: {max(0, min(10, total)):.1f}")
        else:
            total = aa + ab + ac + ad + ae + af + ag + ah + ai
            print(f"\n{'─'*140}")
            print(f"📈 {ticker_busca:8s} | AÇÃO  | Nota: {nota:5.1f}")
            print(f"{'─'*140}")
            print(f"  AA(ROE) {aa:>5.0f}  +  AB(Marg) {ab:>5.0f}  +  AC(Result) {ac:>5.0f}  +  AD(Osc) {ad:>5.0f}  +  AE(Div) {ae:>5.0f}")
            print(f"  AF(P/VP) {af:>5.0f}  +  AG(P/L) {ag:>5.0f}  +  AH(Lucro) {ah:>5.0f}  +  AI(Ativo) {ai:>5.0f}")
            print(f"{'─'*140}")
            print(f"  Subtotal: {aa} + {ab} + {ac} + {ad} + {ae} + {af} + {ag} + {ah} + {ai} = {total} → NOTA FINAL (cap 0-10): {max(0, min(10, total)):.1f}")

    print("\n" + "="*140 + "\n")

if __name__ == "__main__":
    tickers = [
        'EQPA3', 'ALUP3', 'ITSA4', 'ITUB3', 'SANB4', 'BBDC4',
        'ABCB4', 'BRSR6', 'BEES3', 'BNBR3', 'BPAC11', 'BPAC3',
        'BBAS3', 'BAZA3', 'BGIP4', 'BSLI4'
    ]
    analisar_tickers_composicao(tickers)
