# Engines

Este diretório concentrará os algoritmos centrais do MS Analytics.

As engines não podem acessar `SpreadsheetApp`, `PropertiesService`, `UrlFetchApp` ou qualquer API de infraestrutura. Elas trabalham somente com modelos de domínio, value objects e contratos.

`StatisticsEngine` apenas coordena `FrequencyAnalyzer`, `DelayAnalyzer`, `WindowAnalyzer` e `RankingAnalyzer`.

Implementações previstas: `StatisticsEngine`, `CriteriaEngine`, `ScoreEngine`, `GamesEngine`, `BudgetEngine` e `BolaoEngine`.
