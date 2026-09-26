#!/usr/bin/env python3
"""
Valida se os dados foram gravados SEM % ou COM %
"""
import json
import os

# Simulando um teste de tipo de dado
teste_dados = {
    'com_percent': "26.40%",      # ❌ TEXTO com %
    'sem_percent': 26.40,          # ✅ NÚMERO puro
    'sem_percent_int': 26,         # ✅ NÚMERO inteiro
}

print("\n" + "="*80)
print("🔍 VALIDAÇÃO DE TIPOS DE DADOS")
print("="*80 + "\n")

for chave, valor in teste_dados.items():
    tipo = type(valor).__name__
    print(f"{chave:20s}: {str(valor):20s} → tipo: {tipo}")

    if isinstance(valor, str) and "%" in valor:
        print(f"  ❌ ERRO: Gravado como TEXTO com %\n")
    elif isinstance(valor, (int, float)):
        print(f"  ✅ OK: Gravado como NÚMERO puro\n")

print("="*80)
print("\n📋 O que deveria ser gravado na planilha:")
print("  ROE: 26.4  (número float, NÃO '26.4%' ou '26.4'%')")
print("  Marg: 30.8  (número float, NÃO '30.8%')")
print("  Result: 28.94  (número float, NÃO '28.94%')")
print("="*80 + "\n")

print("🎯 Se na planilha você vir:")
print("  ✅ 26.4  (número) → Correto! ✅")
print("  ❌ 26.4% (texto)  → Errado! ❌")
print("\n")
