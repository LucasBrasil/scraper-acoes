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
            return None

        soup = BeautifulSoup(response.text, 'html.parser')

        return {
            'preco': extrair_valor(soup, 'Cotacao'),
            'roe': extrair_valor(soup, 'ROE'),
            'margem_liquida': extrair_valor(soup, 'Marg. Liquida'),
            'resultado_12m': extrair_valor(soup, 'Resultado'),
            'dividendos': extrair_valor(soup, 'Div. Yield'),
            'pvp': extrair_valor(soup, 'P/VP')
        }

    except requests.exceptions.Timeout:
        if tentativa < 3:
            time.sleep(5)
            return buscar_dados_fundamentus(ticker, tentativa + 1)
        return None
    except Exception as e:
        return None

def extrair_valor(soup, label):
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
    except:
        return 0.0

def atualizar_planilha_super_lento(worksheet, tickers):
    """Atualiza com delay gigante entre requisicoes para evitar quota"""
    try:
        linhas = worksheet.get_all_values()
        total = 0

        print("\nColetando dados...")
        dados_para_atualizar = []

        for idx, linha in enumerate(linhas[1:], start=2):
            if not linha or not linha[0]:
                continue

            ticker = linha[0].strip().upper()
            if not eh_ticker_valido(ticker):
                continue

            print(f"[{total+1}] Buscando {ticker}...", end=" ")
            dados = buscar_dados_fundamentus(ticker)

            if dados:
                dados_para_atualizar.append((idx, ticker, dados))
                print("✓")
                total += 1
            else:
                print("✗")

            time.sleep(2)

        print(f"\n{total} tickers coletados. Iniciando atualizacao...")
        print("AVISO: Processamento LENTO para evitar erro 429\n")

        # Atualiza um por um com delay gigante
        for i, (idx, ticker, dados) in enumerate(dados_para_atualizar, 1):
            try:
                print(f"[{i}/{total}] Atualizando {ticker}...", end=" ")

                # Atualiza 6 celulas de uma vez (D-I)
                worksheet.update(
                    f'{WORKSHEET_NAME}!D{idx}:I{idx}',
                    [[
                        round(dados['preco'], 2) if dados['preco'] else 0,
                        f"{round(dados['roe'], 2)}%" if dados['roe'] else "0%",
                        f"{round(dados['margem_liquida'], 2)}%" if dados['margem_liquida'] else "0%",
                        f"{round(dados['resultado_12m'], 2)}%" if dados['resultado_12m'] else "0%",
                        f"{round(dados['dividendos'], 2)}%" if dados['dividendos'] else "0%",
                        round(dados['pvp'], 2) if dados['pvp'] else 0
                    ]]
                )
                print("✓")
            except Exception as e:
                print(f"✗ {str(e)[:40]}")

            # GRANDE DELAY entre requisicoes
            if i < total:
                time.sleep(8)  # 8 segundos entre cada atualização

        print(f"\n✓ Concluído! {total} tickers atualizados")

    except Exception as e:
        print(f"Erro: {e}")

def eh_ticker_valido(ticker):
    import re
    return bool(re.match(r'^[A-Z]{4,5}[0-9]{1,2}$', ticker))

def main():
    import os
    service_account_json = os.environ.get('GOOGLE_CREDENTIALS')

    if not service_account_json:
        print("Erro: GOOGLE_CREDENTIALS nao definida")
        return

    worksheet = conectar_google_sheets(service_account_json)
    if not worksheet:
        print("Erro: Nao foi possivel conectar com Google Sheets")
        return

    linhas = worksheet.get_all_values()
    tickers = [linha[0].strip().upper() for linha in linhas[1:] if linha and linha[0]]

    if not tickers:
        print("Nenhum ticker encontrado")
        return

    print(f"Processando {len(tickers)} tickers...")
    atualizar_planilha_super_lento(worksheet, tickers)

if __name__ == "__main__":
    main()
