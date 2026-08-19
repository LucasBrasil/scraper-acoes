# Contrato da aba Histórico

Esta é a única origem de dados da Statistics Engine.

| Coluna | Cabeçalho | Tipo | Regra |
| --- | --- | --- | --- |
| A | Concurso | número | Inteiro positivo e único. |
| B | Data | data | Data válida do sorteio. |
| C–H | Dezena 1 a Dezena 6 | número | Seis dezenas únicas entre 1 e 60. |

Os cabeçalhos devem ser exatamente: `Concurso`, `Data`, `Dezena 1`, `Dezena 2`, `Dezena 3`, `Dezena 4`, `Dezena 5`, `Dezena 6`.

A ordem das linhas não é relevante: o repositório ordena os concursos pelo número de forma decrescente para os cálculos.
