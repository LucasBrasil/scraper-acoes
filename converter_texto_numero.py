#!/usr/bin/env python3
"""
Converte as colunas de TEXTO para NÚMERO na planilha
Colunas: B, C, E, F, G, H, I, J, L
"""
import gspread
from google.oauth2.service_account import Credentials

def converter_valor(valor):
    """Converte valor de texto para número"""
    if not valor:
        return 0

    # Remove símbolos
    valor_limpo = str(valor).replace('%', '').replace(',', '.').strip()

    try:
        return float(valor_limpo)
    except:
        return 0

# Conectar
scopes = ['https://www.googleapis.com/auth/spreadsheets']
creds = Credentials.from_service_account_file('credentials.json', scopes=scopes)
client = gspread.authorize(creds)

sheet = client.open('Carteira Atualizada')
ws = sheet.worksheet('Dados')

# Colunas a converter (números)
colunas_converter = [2, 3, 5, 6, 7, 8, 9, 10, 12]  # B, C, E, F, G, H, I, J, L

# Ler dados
dados = ws.get_all_values()
total_linhas = len(dados)

print(f"Total de linhas: {total_linhas}")
print(f"Convertendo colunas: B, C, E, F, G, H, I, J, L\n")

# Converter cada coluna
for col_num in colunas_converter:
    col_letra = chr(64 + col_num)  # A=1, B=2, etc.
    print(f"Convertendo coluna {col_letra}...")

    updates = []
    for row in range(2, total_linhas + 1):
        valor = dados[row-1][col_num-1] if col_num-1 < len(dados[row-1]) else ""
        valor_convertido = converter_valor(valor)

        updates.append({
            'range': f'{col_letra}{row}',
            'values': [[valor_convertido]]
        })

    # Gravar em batch
    for i in range(0, len(updates), 100):
        batch = updates[i:i+100]
        try:
            for update in batch:
                ws.update(range_name=update['range'], values=update['values'])
            print(f"  ✅ Linhas {i+2} a {min(i+102, total_linhas)} convertidas")
        except Exception as e:
            print(f"  ❌ Erro: {e}")

print(f"\n✅ Conversão concluída!")
print(f"Próximo passo: As fórmulas AA-AI devem funcionar agora!")
