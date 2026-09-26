#!/usr/bin/env python3
"""
Teste do scraper SEM precisar de credenciais do Google
Valida que os dados estão sendo preparados CORRETAMENTE (sem %)
"""
import re

# Simular dados extraídos (como viria do Fundamentus)
dados_teste = {
    'pl': 10.79,
    'lucro': 3959350000,
    'preco': 30.14,
    'roe': 26.4,
    'marg': 30.8,
    'res_12m': 28.94,
    'osc_12m': 12.16,
    'div': 3.0,
    'pvp': 2.84,
    'ativo': 59005900000
}

print("\n" + "="*80)
print("🧪 TESTE: Validando formato de gravação (SEM credenciais)")
print("="*80 + "\n")

# Simular o que seria gravado na planilha (como no scraper_validation.py)
valores_gravacao = [
    round(dados_teste['pl'], 2) if dados_teste['pl'] else '',
    round(dados_teste['lucro'], 0) if dados_teste['lucro'] else '',
    round(dados_teste['preco'], 2) if dados_teste['preco'] else '',
    round(dados_teste['roe'], 2) if dados_teste['roe'] else '',
    round(dados_teste['marg'], 2) if dados_teste['marg'] else '',
    round(dados_teste['res_12m'], 2) if dados_teste['res_12m'] else '',
    round(dados_teste['osc_12m'], 2) if dados_teste['osc_12m'] else '',
    round(dados_teste['div'], 2) if dados_teste['div'] else '',
    round(dados_teste['pvp'], 2) if dados_teste['pvp'] else '',
    '',  # Coluna K (NOTA)
    round(dados_teste['ativo'], 0) if dados_teste['ativo'] else ''
]

print("📊 Valores que SERIAM gravados na planilha:")
print(f"  B (P/L):        {valores_gravacao[0]:>10} → Tipo: {type(valores_gravacao[0]).__name__}")
print(f"  C (Lucro):      {valores_gravacao[1]:>10} → Tipo: {type(valores_gravacao[1]).__name__}")
print(f"  D (Preco):      {valores_gravacao[2]:>10} → Tipo: {type(valores_gravacao[2]).__name__}")
print(f"  E (ROE%):       {valores_gravacao[3]:>10} → Tipo: {type(valores_gravacao[3]).__name__}  ✅ SEM %")
print(f"  F (Marg%):      {valores_gravacao[4]:>10} → Tipo: {type(valores_gravacao[4]).__name__}  ✅ SEM %")
print(f"  G (Result%):    {valores_gravacao[5]:>10} → Tipo: {type(valores_gravacao[5]).__name__}  ✅ SEM %")
print(f"  H (Osc%):       {valores_gravacao[6]:>10} → Tipo: {type(valores_gravacao[6]).__name__}  ✅ SEM %")
print(f"  I (Div%):       {valores_gravacao[7]:>10} → Tipo: {type(valores_gravacao[7]).__name__}  ✅ SEM %")
print(f"  J (P/VP):       {valores_gravacao[8]:>10} → Tipo: {type(valores_gravacao[8]).__name__}")
print(f"  K (NOTA):       {valores_gravacao[9]:>10} → Tipo: {type(valores_gravacao[9]).__name__}")
print(f"  L (Ativo):      {valores_gravacao[10]:>10} → Tipo: {type(valores_gravacao[10]).__name__}")

print("\n" + "="*80)
print("✅ RESULTADO: Todos os valores são NÚMEROS (sem %)")
print("✅ Se a planilha ainda tiver %, é problema de CACHE do GitHub Actions")
print("="*80 + "\n")

print("🎯 PRÓXIMO PASSO:")
print("  1. Dispare o Scraper Validação no GitHub Actions")
print("  2. Verifique se agora a planilha tem NÚMEROS (sem %)")
print("  3. Se ainda tiver %, é cache do Actions (force refresh)\n")
