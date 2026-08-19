# Contrato da aba Estatísticas

A aba é preenchida automaticamente pelo item **MS Analytics → Atualizar Estatísticas**. Não requer fórmulas manuais.

| Coluna | Cabeçalho | Origem |
| --- | --- | --- |
| A | Dezena | `Statistic.number` |
| B | Frequência | `Statistic.frequency` |
| C | Ranking | `Statistic.ranking` |
| D | Atraso | `Statistic.delay` |
| E | Últimos20 | `Statistic.last20` |
| F | Últimos50 | `Statistic.last50` |
| G | Últimos100 | `Statistic.last100` |
| H | Score | Score calculado pelo Score Engine |
| I | Ranking Score | Ranking gerado pelo Score Engine |
| J | Ranking Geral | Ranking gerado pelo Ranking Engine |
| K | Selecionada | `TRUE` quando a dezena pertence ao conjunto candidato |

Na Sprint 4, as colunas `Score` e `Ranking Score` são atualizadas pelo item **MS Analytics → Atualizar Score**.

Na Sprint 5, `Ranking Geral` é atualizado por **Atualizar Ranking** e `Selecionada` por **Atualizar Seleção**.
