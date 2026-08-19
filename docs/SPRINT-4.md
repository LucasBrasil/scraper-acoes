# Sprint 4 — Score Engine

## Objetivo

Transformar os resultados de critérios agrupados em `NumberAnalysis` em um score rastreável por dezena. O Score Engine não recebe `Statistic`.

```text
History → Statistics Engine → Criteria Engine → NumberAnalysis → Score Engine → Ranking
```

## Componentes

- `IScoreCalculator`: contrato de cálculo de score.
- `WeightedScoreCalculator`: soma os pontos dos critérios aprovados.
- `ScoreBreakdown`: identifica critério, pontos e motivo de cada contribuição.
- `ScoreResult`: resultado com dezena, score, ranking e detalhamento.
- `ScoreEngine`: aplica o calculador e ordena os resultados.
- `ScoreService`: orquestra estatísticas, critérios, score e persistência.

## Ordenação e ranking

O ranking é posicional e usa, nesta ordem:

1. Score, do maior para o menor.
2. Frequência, da maior para a menor, em caso de empate de score.
3. Número da dezena, do menor para o maior, em caso de novo empate.

## Atualização da planilha

O menu **MS Analytics → Atualizar Score** executa o fluxo completo e atualiza as colunas `Score` e `Ranking Score` da aba `Estatísticas`. A leitura de critérios continua limitada à aba `Critérios`; a aba Histórico não é acessada nesta sprint.

## Fora do escopo

- Novas fórmulas de score, seleção de jogos, bolões, dashboard e API Mega-Sena.
