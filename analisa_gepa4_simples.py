#!/usr/bin/env python3
"""
Análise de nota GEPA4 - Simulação sem credenciais
"""

def calcular_score_metrica(valor, ranges):
    """Calcula o score baseado nas faixas"""
    for min_val, max_val, score in ranges:
        if min_val <= valor <= max_val:
            return score
    return 0

# Dados de GEPA4 (fictícios - você pode substituir pelos reais)
ticker = "GEPA4"
pl = 8.5
lucro = 50000000
preco = 15.25
roe = 12.5
marg = 8.3
result = 6.7
osc = -15.2
div = 4.2
pvp = 1.1
nota_atual = 10

print("=" * 80)
print(f"📊 ANÁLISE DE NOTA - {ticker}")
print("=" * 80)

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
print(f"  Nota Atual:    {nota_atual:.2f}")

# Verificar se é banco
eh_banco = ticker in ["ITUB3", "SANB4", "BBDC4", "ABCB4", "BRSR6", "BEES3", "BNBR3", "BPAC11", "BPAC3", "BBAS3", "BAZA3", "BGIP4", "BSLI4", "BMGB4"]
print(f"\n🏦 VERIFICAÇÃO:\n")
print(f"  É Banco?       {'SIM ✅' if eh_banco else 'NÃO ❌'}")

# Calcular scores com regras ATUAIS
print(f"\n📋 CÁLCULO COM REGRAS ATUAIS (antes da mudança):\n")

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
    print(f"\n  ➕ FÓRMULA BANCO: ROE + Osc + Div + PVP + 2")
else:
    total_antes = score_roe + score_marg + score_result + score_osc + score_div + score_pvp
    print(f"\n  ➕ FÓRMULA OUTROS: ROE + Marg + Result + Osc + Div + PVP")

print(f"  SOMA: {score_roe} + {score_marg} + {score_result} + {score_osc} + {score_div} + {score_pvp} = {total_antes:.0f}")
print(f"  RESULTADO (com MIN 10): {min(10, total_antes):.0f} ⭐")

# Calcular com regras NOVAS (0-10)
print(f"\n📊 CÁLCULO COM REGRAS NOVAS (0-10, SEM NEGATIVOS):\n")

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
    print(f"\n  ➕ FÓRMULA BANCO: ROE + Osc + Div + PVP + 1")
else:
    total_novo = score_roe_novo + score_marg_novo + score_result_novo + score_osc_novo + score_div_novo + score_pvp_novo + score_pl_novo
    print(f"\n  ➕ FÓRMULA OUTROS: ROE + Marg + Result + Osc + Div + PVP + P/L")

print(f"  SOMA: {score_roe_novo} + {score_marg_novo} + {score_result_novo} + {score_osc_novo} + {score_div_novo} + {score_pvp_novo} + {score_pl_novo} = {total_novo:.0f}")
print(f"  RESULTADO (com MIN 10): {min(10, total_novo):.0f} ⭐")

print("\n" + "=" * 80)
print(f"📌 RESUMO DA MUDANÇA:\n")
print(f"  Nota Atual (Regras Antigas):   {min(10, total_antes):.0f} ⭐")
print(f"  Nota Nova (Regras 0-10):      {min(10, total_novo):.0f} ⭐")
print(f"  Diferença:                    {min(10, total_novo) - min(10, total_antes):+.0f} pontos")

if min(10, total_novo) < min(10, total_antes):
    print(f"\n  ⬇️  GEPA4 ficará com nota MENOR com as regras novas")
else:
    print(f"\n  ⬆️  GEPA4 ficará com nota IGUAL ou MAIOR com as regras novas")

print("=" * 80)
