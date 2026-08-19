# Sprint 2 — Statistics Engine

## Objetivo

Implementar o primeiro módulo funcional do MS Analytics: o motor de estatísticas das dezenas da Mega-Sena. A fonte de dados é exclusivamente a aba `Histórico`.

## Fluxo arquitetural

```text
Histórico → HistoryRepository → Contest → StatisticsEngine → StatisticDTO → StatisticsRepository → Estatísticas
```

Nenhuma engine acessa Google Sheets. A `StatisticsService` somente orquestra o fluxo; os cálculos permanecem no `StatisticsEngine`.

## Entregas

- `Contest` e `Statistic` como modelos de domínio.
- `IHistoryRepository`, `IStatisticsEngine` e `IStatisticsRepository` como contratos.
- `HistoryRepository` para converter linhas de Histórico em concursos e salvar concursos futuros.
- `StatisticsRepository` para persistir o resultado na aba Estatísticas.
- `StatisticsEngine` como coordenadora de frequência, ranking, atraso e janelas históricas.
- Analisadores independentes de frequência, atraso, janelas e ranking.
- `StatisticDTO` para transporte de dados.
- `StatisticsService` para orquestração.
- Item de menu **MS Analytics → Atualizar Estatísticas**.
- Testes unitários do motor com dados simulados.

## Regras de cálculo

- Todas as dezenas de 1 a 60 são retornadas, mesmo que nunca tenham sido sorteadas.
- Os concursos são ordenados pelo número, do mais recente para o mais antigo.
- Frequência é o total de ocorrências no histórico disponível.
- Atraso é a quantidade de concursos desde a última ocorrência; a dezena do concurso mais recente tem atraso `0`.
- Quando uma dezena não existe no histórico, seu atraso é igual à quantidade total de concursos.
- `windows` é uma coleção flexível de contagens por tamanho de janela; nesta sprint, ela contém 20, 50 e 100 concursos.
- A lista é ordenada pelo ranking de frequência. Empates são ordenados pela dezena em ordem crescente, resultando em ranking posicional único.
- `rankings.frequency` é o único ranking calculado nesta sprint; a estrutura suporta rankings futuros por score, tendência e sequência.
- Score e tendência (`trend`) são sempre `0` nesta sprint.

## Fora do escopo

- Score calculado, sequências, critérios, jogos, bolões, dashboard e API Mega-Sena.
