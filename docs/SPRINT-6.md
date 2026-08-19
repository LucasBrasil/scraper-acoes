# Sprint 6 — Pipeline Engine e MVP Operacional

## Objetivo

Permitir a execução integral do MS Analytics com um clique, sem adicionar regras de negócio às engines existentes.

```text
Histórico → Statistics Service → Criteria Service → Score Service → Ranking Service → Selection Service → Dashboard
```

## Pipeline

`PipelineService` monta as etapas. `PipelineEngine` as executa em ordem, mede duração, interrompe na primeira falha e retorna `PipelineResult`. `PipelineContext` compartilha ID, data/hora de início, configuração e metadados entre as etapas.

Cada etapa gera um registro na aba `Log`, contendo ID da execução, etapa, início, término, duração, resultado e mensagem.

## Execução

Use **MS Analytics → ▶ Atualizar Tudo**. O fluxo atualiza Estatísticas, Critérios, Score, Ranking, Seleção e Dashboard.

## Dashboard MVP

O Dashboard contém somente: Último Concurso, Quantidade de Concursos, Top 25, Maior Score, Quantidade de Critérios Ativos, Tempo da Última Execução e Status.

## Fora do escopo

- Geração de jogos, dashboard analítico, alertas, reprocessamento parcial ou execução agendada.
