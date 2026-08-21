import requests
from bs4 import BeautifulSoup
import gspread
from google.oauth2.service_account import Credentials
import time
import json
from datetime import datetime

# Configuracoes
SPREADSHEET_ID = "1jWB62sB7dxjeWjNUej8QYZNWwV5OzQcTCievEukBOH8"
WORKSHEET_NAME = "Dados"

# Escopos do Google Sheets
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


def buscar_dados_fundamentus(ticker):
    """Busca dados de uma acao no Fundamentus"""
    try:
        url = f"https://fundamentus.com.br/resultado.php?papel={ticker}"

        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }

        response = requests.get(url, headers=headers, timeout=10)
        response.encoding = "utf-8"

        if response.status_code != 200:
            print(f"Erro HTTP {response.status_code} para {ticker}")
            return None

        soup = BeautifulSoup(response.text, "html.parser")

        # Busca os dados na tabela
        dados = {
            "preco": extrair_valor(soup, "Cotacao"),
            "roe": extrair_valor(soup, "ROE"),
            "margem_liquida": extrair_valor(soup, "Marg. Liquida"),
            "resultado_12m": extrair_valor(soup, "Resultado"),
            "dividendos": extrair_valor(soup, "Div. Yield"),
            "pvp": extrair_valor(soup, "P/VP")
        }

        return dados

    except Exception as e:
        print(f"Erro ao buscar {ticker}: {e}")
        return None


def extrair_valor(soup, label):
    """Extrai valor da tabela do Fundamentus"""
    try:
        # Procura pela linha que contem o label
        linhas = soup.find_all("td")

        for i, td in enumerate(linhas):
            if label.lower() in td.get_text().lower():
                # O valor geralmente está na próxima célula ou na célula seguinte
                if i + 1 < len(linhas):
                    valor_text = linhas[i + 1].get_text().strip()
                    # Remove símbolo de % se tiver
                    valor_text = valor_text.replace("%", "").strip()
                    # Converte formato brasileiro para número
                    valor_text = valor_text.replace(".", "").replace(",", ".")
                    try:
                        return float(valor_text)
                    except:
                        return 0.0
        return 0.0

    except Exception as e:
        print(f"Erro ao extrair {label}: {e}")
        return 0.0


def atualizar_planilha(worksheet, tickers):
    """Atualiza a planilha com dados dos tickers"""
    try:
        # Pega os dados atuais
        linhas = worksheet.get_all_values()

        # Atualiza cada ticker
        for idx, linha in enumerate(linhas[1:], start=2):  # Comeca da linha 2 (pulando cabecalho)
            if not linha or not linha[0]:
                continue

            ticker = linha[0].strip().upper()

            # Valida se eh um ticker
            if not eh_ticker_valido(ticker):
                continue

            print(f"Buscando dados de {ticker}...")

            dados = buscar_dados_fundamentus(ticker)

            if dados:
                # Atualiza as colunas D-I (indices 3-8)
                # D: Preco
                worksheet.update_cell(idx, 4, round(dados["preco"], 2) if dados["preco"] else 0)
                # E: ROE%
                worksheet.update_cell(idx, 5, f"{round(dados['roe'], 2)}%" if dados["roe"] else "0%")
                # F: Margem Liquida%
                worksheet.update_cell(idx, 6, f"{round(dados['margem_liquida'], 2)}%" if dados["margem_liquida"] else "0%")
                # G: Resultado 12m%
                worksheet.update_cell(idx, 7, f"{round(dados['resultado_12m'], 2)}%" if dados["resultado_12m"] else "0%")
                # H: Dividendos%
                worksheet.update_cell(idx, 8, f"{round(dados['dividendos'], 2)}%" if dados["dividendos"] else "0%")
                # I: P/VP
                worksheet.update_cell(idx, 9, round(dados["pvp"], 2) if dados["pvp"] else 0)

                print(f"✓ {ticker} atualizado")
            else:
                print(f"✗ Erro ao atualizar {ticker}")

            # Delay para nao sobrecarregar o Fundamentus
            time.sleep(2)

        print(f"\n✓ Planilha atualizada em {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")

    except Exception as e:
        print(f"Erro ao atualizar planilha: {e}")


def eh_ticker_valido(ticker):
    """Valida se eh um ticker valido"""
    import re
    return bool(re.match(r"^[A-Z]{4,5}[0-9]{1,2}$", ticker))


def main():
    """Funcao principal"""
    # Carrega as credenciais do Google (pode ser variavel de ambiente)
    import os
    service_account_json = os.environ.get("GOOGLE_CREDENTIALS")

    if not service_account_json:
        print("Erro: GOOGLE_CREDENTIALS nao definida")
        print("Configure a variavel de ambiente com o JSON das credenciais do Google")
        return

    # Conecta com Google Sheets
    worksheet = conectar_google_sheets(service_account_json)

    if not worksheet:
        print("Nao foi possivel conectar com Google Sheets")
        return

    # Busca todos os tickers
    linhas = worksheet.get_all_values()
    tickers = [linha[0].strip().upper() for linha in linhas[1:] if linha and linha[0]]

    if not tickers:
        print("Nenhum ticker encontrado na planilha")
        return

    print(f"Atualizando {len(tickers)} tickers...")

    # Atualiza a planilha
    atualizar_planilha(worksheet, tickers)


if __name__ == "__main__":
    main()
