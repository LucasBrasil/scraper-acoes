# Contrato da aba Critérios

A aba `Critérios` configura quais regras de decisão estão ativas e seus pesos. Ela não armazena resultados de avaliação.

| Coluna | Cabeçalho | Tipo | Regra |
| --- | --- | --- | --- |
| A | Critério | texto | Nome idêntico ao retornado por `ICriterion.getName()`. |
| B | Ativo | booleano | `TRUE` ativa a regra; `FALSE` a ignora. |
| C | Peso | número | Peso atribuído quando a regra aprovar uma dezena. |

Configuração inicial:

| Critério | Ativo | Peso |
| --- | --- | --- |
| Lowest Sequence | TRUE | 10 |

O valor `10` é somente um exemplo de configuração da planilha; nenhum peso é definido no código.
