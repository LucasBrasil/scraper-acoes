#!/usr/bin/env python3
import requests
import re

def extrair_numero(match_obj):
    if not match_obj:
        return 0.0
    texto = match_obj.group(1) if match_obj.lastindex else match_obj.group(0)
    texto = texto.replace('%', '').strip()
    texto = texto.replace('.', '').replace(',', '.')
    try:
        return float(texto)
    except:
        return 0.0

def buscar_dados(ticker):
    try:
        url = f"https://fundamentus.com.br/detalhes.php?papel={ticker}"
        h = {"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120.0.0.0"}
        r = requests.get(url, headers=h, timeout=60)
        if r.status_code != 200:
            print(f"Erro: Status {r.status_code}")
            return None
        html = r.text

        cotacao = extrair_numero(re.search(r'>Cotação<.*?<span class="txt">\s*([0-9.,]+)', html, re.IGNORECASE | re.DOTALL))
        roe = extrair_numero(re.search(r'>ROE<.*?<span class="txt">\s*([0-9.,]+%)', html, re.IGNORECASE | re.DOTALL))
        marg = extrair_numero(re.search(r'>Marg\. Líquida<.*?<span class="txt">\s*([0-9.,]+%)', html, re.IGNORECASE | re.DOTALL))
        div = extrair_numero(re.search(r'>Div\. Yield<.*?<span class="txt">\s*([0-9.,]+%)', html, re.IGNORECASE | re.DOTALL))
        pvp = extrair_numero(re.search(r'>P/VP<.*?<span class="txt">\s*([0-9.,]+)', html, re.IGNORECASE | re.DOTALL))

        osc_match = re.search(r'>12 meses<.*?<span class="oscil">[^<]*<font[^>]*>([0-9.,\-]+)', html, re.IGNORECASE | re.DOTALL)
        osc_12m = extrair_numero(osc_match) if osc_match else 0.0

        resultado_12m = 0.0
        receita_match = re.search(r'>Receita Líquida<.*?<span class="txt">\s*([0-9.,]+)', html, re.IGNORECASE | re.DOTALL)
        lucro_match = re.search(r'>Lucro Líquido<.*?<span class="txt">\s*([0-9.,]+)', html, re.IGNORECASE | re.DOTALL)
        if receita_match and lucro_match:
            receita = extrair_numero(receita_match)
            lucro = extrair_numero(lucro_match)
            if receita > 0:
                resultado_12m = (lucro / receita) * 100

        pl = extrair_numero(re.search(r'>P/L<.*?<span class="txt">\s*([0-9.,\-]+)', html, re.IGNORECASE | re.DOTALL))
        lucro = extrair_numero(re.search(r'>Lucro Líquido<.*?<span class="txt">\s*([0-9.,\-]+)', html, re.IGNORECASE | re.DOTALL))
        ativo = extrair_numero(re.search(r'>Ativo</span></td>\s*<td[^>]*><span class="txt">\s*([0-9.,]+)', html, re.IGNORECASE | re.DOTALL))

        return {
            'preco': cotacao,
            'roe': roe,
            'marg': marg,
            'osc_12m': osc_12m,
            'res_12m': resultado_12m,
            'div': div,
            'pvp': pvp,
            'pl': pl,
            'lucro': lucro,
            'ativo': ativo
        }
    except Exception as e:
        print(f"Erro: {e}")
        return None

if __name__ == "__main__":
    # Teste com EGIE3
    print("=" * 70)
    print("VALIDAÇÃO DE DADOS - TICKER: EGIE3")
    print("=" * 70)

    dados = buscar_dados("EGIE3")

    if dados:
        print(f"\n{'Indicador':<25} {'Valor Extraído':<20} {'Formatado para Planilha':<20}")
        print("-" * 70)
        print(f"{'Preço':<25} {dados['preco']:<20.2f} {dados['preco']:.2f}")
        print(f"{'P/L':<25} {dados['pl']:<20.2f} {dados['pl']:.2f}")
        print(f"{'Lucro Líquido':<25} {dados['lucro']:<20.0f} {int(dados['lucro'])}")
        print(f"{'ROE %':<25} {dados['roe']:<20.2f} {dados['roe']:.2f}%")
        print(f"{'Margem Líquida %':<25} {dados['marg']:<20.2f} {dados['marg']:.2f}%")
        print(f"{'Resultado 12M %':<25} {dados['res_12m']:<20.2f} {dados['res_12m']:.2f}%")
        print(f"{'Oscilação 12M %':<25} {dados['osc_12m']:<20.2f} {dados['osc_12m']:.2f}%")
        print(f"{'Dividend Yield %':<25} {dados['div']:<20.2f} {dados['div']:.2f}%")
        print(f"{'P/VP':<25} {dados['pvp']:<20.2f} {dados['pvp']:.2f}")
        print(f"{'P/Ativos':<25} {dados['ativo']:<20.2f} {int(dados['ativo'])}")
        print("\n" + "=" * 70)
    else:
        print("Falha ao buscar dados")
