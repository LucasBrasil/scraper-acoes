import requests
from bs4 import BeautifulSoup
import gspread
from google.oauth2.service_account import Credentials
import time
import json
from datetime import datetime

SPREADSHEET_ID = "COLE_AQUI_O_ID_DA_PLANILHA"
WORKSHEET_NAME = "Dados"
SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]

def conectar_google_sheets(service_account_json):
    """Conecta com Google Sheets usando credenciais de service account"""
    try:
        credentials = Credentials.from_service_account_info(
            json.loads(service_account_json),
            scopes=SCOPES
        )
        client = gspread.authorize(credentials)
        spreadsheet = client.open_by_key(SPREADSHEET_ID)
        worksheet = spreadsheet.worksheet(WORKSHEET_NAME)
        return worksheet
    except Exception as e:
        print(f"Erro ao conectar com Google Sheets: {e}")
        return None

def buscar_dados_fundamentus(ticker, tentativa=1):
    """Busca dados de uma acao no Fundamentus com retry"""
    try:
        url = f"https://fundamentus.com.br/resultado.php?papel={ticker}"

        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept-Language": "pt-BR,pt;q=0.9",
            "Accept-Encoding": "gzip, deflate, br",
            "Connection": "keep-alive",
            "Referer": "https://fundamentus.com.br/"
        }

        response = requests.get(url, headers=headers, timeout=30)
        response.encoding = 'utf-8'

        if response.status_code != 200:
            print(f"Erro HTTP {response.status_code} para {ticker}")
            return None

        soup = BeautifulSoup(response.text, 'html.parser')

        dados = {
            'preco': extrair_valor(soup, 'Cotacao'),
            'roe': extrair_valor(soup, 'ROE'),
            'margem_liquida': extrair_valor(soup, 'Marg. Liquida'),
            'resultado_12m': extrair_valor(soup, 'Resultado'),
            'dividendos': extrair_valor(soup, 'Div. Yield'),
            'pvp': extrair_valor(soup, 'P/VP')
        }

        return dados

    except requests.exceptions.Timeout:
        if tentativa < 3:
            print(f"Timeout para {ticker}. Tentando novamente (tentativa {tentativa + 1})...")
            time.sleep(5)
            return buscar_dados_fundamentus(ticker, tentativa + 1)
        else:
            print(f"Falha ao buscar {ticker} após 3 tentativas")
            return None
    except Exception as e:
        print(f"Erro ao buscar {ticker}: {e}")
        return None

def extrair_valor(soup, label):
    """Extrai valor da tabela do Fundamentus"""
    try:
        linhas = soup.find_all('td')

        for i, td in enumerate(linhas):
            if label.lower() in td.get_text().lower():
                if i + 1 < len(linhas):
                    valor_text = linhas[i + 1].get_text().strip()
                    valor_text = valor_text.replace('%', '').strip()
                    valor_text = valor_text.replace('.', '').replace(',', '.')
                    try:
                        return float(valor_text)
                    except:
                        return 0.0
        return 0.0

    except Exception as e:
        return 0.0

def atualizar_planilha_batch_otimizado(worksheet, tickers):
    """Atualiza a planilha com batch updates em lotes para evitar quota exceeded"""
    try:
        linhas = worksheet.get_all_values()
        total_processadas = 0
        lote_size = 25  # Processa 25 tickers por vez

        # Coleta todos os dados primeiro
        todos_dados = {}
        dados_por_linha = {}

        print(f"\nFase 1: Buscando dados de {len(tickers)} tickers...")
        for idx, linha in enumerate(linhas[1:], start=2):
            if not linha or not linha[0]:
                continue

            ticker = linha[0].strip().upper()

            if not eh_ticker_valido(ticker):
                continue

            print(f"Buscando {ticker}...", end=" ")

            dados = buscar_dados_fundamentus(ticker)

            if dados:
                todos_dados[ticker] = dados
                dados_por_linha[idx] = dados
                print("✓")
                total_processadas += 1
            else:
                print("✗")

            time.sleep(2)  # Delay entre requisicoes

        # Agora atualiza em lotes
        print(f"\nFase 2: Atualizando {total_processadas} linhas na planilha em lotes...")
        lotes = list(dados_por_linha.items())

        for i in range(0, len(lotes), lote_size):
            lote = lotes[i:i + lote_size]
            updates = []

            for idx, dados in lote:
                updates.append({
                    'range': f'{WORKSHEET_NAME}!D{idx}:I{idx}',
                    'values': [[
                        round(dados['preco'], 2) if dados['preco'] else 0,
                        f"{round(dados['roe'], 2)}%" if dados['roe'] else "0%",
                        f"{round(dados['margem_liquida'], 2)}%" if dados['margem_liquida'] else "0%",
                        f"{round(dados['resultado_12m'], 2)}%" if dados['resultado_12m'] else "0%",
                        f"{round(dados['dividendos'], 2)}%" if dados['dividendos'] else "0%",
                        round(dados['pvp'], 2) if dados['pvp'] else 0
                    ]]
                })

            if updates:
                lote_num = (i // lote_size) + 1
                total_lotes = (len(lotes) + lote_size - 1) // lote_size
                print(f"  Lote {lote_num}/{total_lotes} ({len(updates)} itens)...", end=" ")

                try:
                    worksheet.spreadsheet.batch_update({
                        'data': updates,
                        'valueInputOption': 'RAW'
                    })
                    print("✓")
                except Exception as e:
                    print(f"✗ {str(e)[:50]}")
                    # Fallback: tenta atualizar um por um
                    print(f"    Tentando atualizar um por um...")
                    for update in updates:
                        try:
                            worksheet.update(update['range'], update['values'])
                            time.sleep(1)
                        except Exception as e2:
                            print(f"    Erro: {str(e2)[:50]}")

                # Aguarda entre lotes para nao exceder quota
                if i + lote_size < len(lotes):
                    print(f"    Aguardando 15 segundos antes do proximo lote...")
                    time.sleep(15)

        print(f"\n✓ {total_processadas} linhas processadas em {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")

    except Exception as e:
        print(f"Erro ao atualizar planilha: {e}")

def eh_ticker_valido(ticker):
    """Valida se eh um ticker valido"""
    import re
    return bool(re.match(r'^[A-Z]{4,5}[0-9]{1,2}$', ticker))

def main():
    """Funcao principal"""
    import os
    service_account_json = os.environ.get('GOOGLE_CREDENTIALS')

    if not service_account_json:
        print("Erro: GOOGLE_CREDENTIALS nao definida")
        return

    worksheet = conectar_google_sheets(service_account_json)

    if not worksheet:
        print("Nao foi possivel conectar com Google Sheets")
        return

    linhas = worksheet.get_all_values()
    tickers = [linha[0].strip().upper() for linha in linhas[1:] if linha and linha[0]]

    if not tickers:
        print("Nenhum ticker encontrado na planilha")
        return

    print(f"Atualizando {len(tickers)} tickers...")

    atualizar_planilha_batch_otimizado(worksheet, tickers)

if __name__ == "__main__":
    main()
