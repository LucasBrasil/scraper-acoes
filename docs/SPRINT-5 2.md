# Sprint 5 — Ranking & Selection Engine

## Objetivo

Classificar resultados de score e reduzir as dezenas a um conjunto de candidatas. Esta sprint não gera jogos.

```text
History → Statistics Engine → Criteria Engine → Score Engine → Ranking Engine → Selection Engine
```

## Ranking Engine

Recebe apenas `ScoreResult` e retorna `RankingResult`. A ordenação é: score decrescente, frequência decrescente e número crescente. A engine não acessa planilhas, repositórios ou interface.

## Selection Engine

Recebe `RankingResult` e aplica `TopSelectionStrategy`. A estratégia seleciona as N primeiras dezenas, onde N é o parâmetro **Quantidade de dezenas candidatas** da aba `Config`. Não há valor de quantidade fixado no código.

## Atualização da planilha

- **MS Analytics → Atualizar Ranking** preenche `Ranking Geral` em `Estatísticas`.
- **MS Analytics → Atualizar Seleção** preenche `Selecionada` como `TRUE` ou `FALSE`.

## Fora do escopo

- Geração, filtragem ou combinação de jogos; bolões; novas estratégias de ranking ou seleção.
