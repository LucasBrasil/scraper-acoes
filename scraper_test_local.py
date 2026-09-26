#!/usr/bin/env python3
"""
Teste local do scraper - busca dados e imprime SEM gravar na planilha
"""
import requests
import time
import re

def buscar(ticker, tentativa=1):
    """Busca dados do Fundamentus"""
    try:
        url = f"https://fundamentus.com.br/detalhes.php?papel={ticker}"
        h = {"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120.0.0.0"}
        r = requests.get(url, headers=h, timeout=60)
        if r.status_code != 200:
            return None
        html = r.text

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
    except requests.exceptions.Timeout:
        if tentativa < 3:
            time.sleep(10)
            return buscar(ticker, tentativa + 1)
        return None
    except Exception as e:
        print(f"❌ Erro: {e}")
        return None

# Testar com alguns tickers
TICKERS_TESTE = ['LOGG3', 'LPSB3', 'ALOS3']

print("\n" + "="*80)
print("🧪 TESTE LOCAL DO SCRAPER (SEM GRAVAR)")
print("="*80 + "\n")

for ticker in TICKERS_TESTE:
    print(f"🔍 Buscando {ticker}...", end=" ", flush=True)
    dados = buscar(ticker)

    if not dados:
        print("❌ FALHOU")
        continue

    print("✅ OK\n")

    # Mostrar valores COMO SERIAM GRAVADOS (sem %)
    print(f"  P/L:           {dados['pl']:.2f}  (tipo: {type(dados['pl']).__name__})")
    print(f"  Lucro:         {dados['lucro']:.0f}  (tipo: {type(dados['lucro']).__name__})")
    print(f"  Preço:         {dados['preco']:.2f}  (tipo: {type(dados['preco']).__name__})")
    print(f"  ROE%:          {dados['roe']:.2f}  (tipo: {type(dados['roe']).__name__})  ✅ SEM %")
    print(f"  Marg%:         {dados['marg']:.2f}  (tipo: {type(dados['marg']).__name__})  ✅ SEM %")
    print(f"  Result 12M%:   {dados['res_12m']:.2f}  (tipo: {type(dados['res_12m']).__name__})  ✅ SEM %")
    print(f"  Osc 12M%:      {dados['osc_12m']:.2f}  (tipo: {type(dados['osc_12m']).__name__})  ✅ SEM %")
    print(f"  Div%:          {dados['div']:.2f}  (tipo: {type(dados['div']).__name__})  ✅ SEM %")
    print(f"  P/VP:          {dados['pvp']:.2f}  (tipo: {type(dados['pvp']).__name__})")
    print(f"  Ativo:         {dados['ativo']:.0f}  (tipo: {type(dados['ativo']).__name__})")
    print()

    time.sleep(1)

print("="*80)
print("✅ TESTE CONCLUÍDO - Todos os dados são NÚMEROS (sem %)")
print("="*80 + "\n")
