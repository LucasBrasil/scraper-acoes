#!/usr/bin/env python3
import gspread
from google.oauth2.service_account import Credentials

# Conectar ao Google Sheets
scopes = ['https://www.googleapis.com/auth/spreadsheets']
creds = Credentials.from_service_account_file('credentials.json', scopes=scopes)
client = gspread.authorize(creds)

# Abrir planilha
sheet = client.open('Carteira Atualizada')
ws = sheet.worksheet('Dados')

# Fórmulas em português com ponto e vírgula
formulas = {
    'AA': '''=SE(E(E{row}>=Regras!$B$2; E{row}<Regras!$C$2); Regras!$D$2;
  SE(E(E{row}>=Regras!$E$2; E{row}<Regras!$F$2); Regras!$G$2;
    SE(E(E{row}>=Regras!$H$2; E{row}<Regras!$I$2); Regras!$J$2;
      SE(E(E{row}>=Regras!$K$2; E{row}<Regras!$L$2); Regras!$M$2;
        SE(E(E{row}>=Regras!$N$2; E{row}<Regras!$O$2); Regras!$P$2; 0)
      )
    )
  )
)''',
    'AB': '''=SE(E(F{row}>=Regras!$B$3; F{row}<Regras!$C$3); Regras!$D$3;
  SE(E(F{row}>=Regras!$E$3; F{row}<Regras!$F$3); Regras!$G$3;
    SE(E(F{row}>=Regras!$H$3; F{row}<Regras!$I$3); Regras!$J$3;
      SE(E(F{row}>=Regras!$K$3; F{row}<Regras!$L$3); Regras!$M$3;
        SE(E(F{row}>=Regras!$N$3; F{row}<Regras!$O$3); Regras!$P$3; 0)
      )
    )
  )
)''',
    'AC': '''=SE(E(G{row}>=Regras!$B$4; G{row}<Regras!$C$4); Regras!$D$4;
  SE(E(G{row}>=Regras!$E$4; G{row}<Regras!$F$4); Regras!$G$4;
    SE(E(G{row}>=Regras!$H$4; G{row}<Regras!$I$4); Regras!$J$4;
      SE(E(G{row}>=Regras!$K$4; G{row}<Regras!$L$4); Regras!$M$4;
        SE(E(G{row}>=Regras!$N$4; G{row}<Regras!$O$4); Regras!$P$4; 0)
      )
    )
  )
)''',
    'AD': '''=SE(E(H{row}>=Regras!$B$5; H{row}<Regras!$C$5); Regras!$D$5;
  SE(E(H{row}>=Regras!$E$5; H{row}<Regras!$F$5); Regras!$G$5; 0)
)''',
    'AE': '''=SE(E(I{row}>=Regras!$B$6; I{row}<Regras!$C$6); Regras!$D$6;
  SE(E(I{row}>=Regras!$E$6; I{row}<Regras!$F$6); Regras!$G$6;
    SE(E(I{row}>=Regras!$H$6; I{row}<Regras!$I$6); Regras!$J$6;
      SE(E(I{row}>=Regras!$K$6; I{row}<Regras!$L$6); Regras!$M$6; 0)
    )
  )
)''',
    'AF': '''=SE(E(J{row}>=Regras!$B$7; J{row}<Regras!$C$7); Regras!$D$7;
  SE(E(J{row}>=Regras!$E$7; J{row}<Regras!$F$7); Regras!$G$7;
    SE(E(J{row}>=Regras!$H$7; J{row}<Regras!$I$7); Regras!$J$7;
      SE(E(J{row}>=Regras!$K$7; J{row}<Regras!$L$7); Regras!$M$7;
        SE(E(J{row}>=Regras!$N$7; J{row}<Regras!$O$7); Regras!$P$7; 0)
      )
    )
  )
)''',
    'AG': '''=SE(E(B{row}>=Regras!$B$8; B{row}<Regras!$C$8); Regras!$D$8;
  SE(E(B{row}>=Regras!$E$8; B{row}<Regras!$F$8); Regras!$G$8;
    SE(E(B{row}>=Regras!$H$8; B{row}<Regras!$I$8); Regras!$J$8;
      SE(E(B{row}>=Regras!$K$8; B{row}<Regras!$L$8); Regras!$M$8; 0)
    )
  )
)''',
    'AH': '''=SE(E(C{row}>=Regras!$B$9; C{row}<Regras!$C$9); Regras!$D$9;
  SE(E(C{row}>=Regras!$E$9; C{row}<Regras!$F$9); Regras!$G$9;
    SE(E(C{row}>=Regras!$H$9; C{row}<Regras!$I$9); Regras!$J$9; 0)
  )
)''',
    'AI': '''=SE(E(L{row}>=Regras!$B$10; L{row}<Regras!$C$10); Regras!$D$10;
  SE(E(L{row}>=Regras!$E$10; L{row}<Regras!$F$10); Regras!$G$10;
    SE(E(L{row}>=Regras!$H$10; L{row}<Regras!$I$10); Regras!$J$10;
      SE(E(L{row}>=Regras!$K$10; L{row}<Regras!$L$10); Regras!$M$10; 0)
    )
  )
)'''
}

# Buscar quantas linhas têm dados
dados = ws.get_all_values()
total_linhas = len(dados)

print(f"Total de linhas: {total_linhas}")
print(f"Gravando fórmulas nas colunas AA a AI (linhas 2 a {total_linhas})...\n")

# Gravar fórmulas (começando na linha 2)
for row in range(2, total_linhas + 1):
    updates = []
    for col, formula_template in formulas.items():
        formula = formula_template.replace('{row}', str(row))
        # Coluna em número (AA=27, AB=28, etc.)
        col_num = ord(col[0]) - ord('A') + 1
        if len(col) > 1:
            col_num = (ord(col[0]) - ord('A') + 1) * 26 + (ord(col[1]) - ord('A') + 1)

        updates.append({
            'range': f'{col}{row}',
            'values': [[formula]]
        })

    # Gravar em batch
    try:
        for update in updates:
            ws.update(range_name=update['range'], values=update['values'])
        if row % 10 == 0:
            print(f"✅ Linha {row} gravada")
    except Exception as e:
        print(f"❌ Erro na linha {row}: {e}")

print(f"\n✅ Fórmulas gravadas com sucesso nas colunas AA a AI!")
print(f"Agora atualize a coluna K com: =MIN(10; SE(CONTAR.SE(Bancos!$A:$A;A2)>0; AA2+AD2+AE2+AF2+AH2+AI2+1; AA2+AB2+AC2+AD2+AE2+AF2+AG2+AH2+AI2))")
