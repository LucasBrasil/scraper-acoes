# Sprint 3 — Criteria Engine

## Objetivo

Criar o primeiro motor de decisão do MS Analytics. Ele analisa apenas objetos `Statistic` produzidos na Sprint 2; não acessa Histórico, Google Sheets ou regras de estatística.

```text
History → Statistics Engine → Statistics → Criteria Engine → Score Engine → Games Engine
```

## Estrutura

- `criteria/ICriterion.gs`: contrato obrigatório para critérios plugáveis.
- `criteria/CriterionResult.gs`: resultado de uma avaliação, incluindo dezena, aprovação, pontos e motivo.
- `criteria/CriteriaEngine.gs`: coordena critérios ativos.
- `criteria/CriteriaRegistry.gs`: registra os critérios disponíveis.
- `criteria/implementations/LowestSequenceCriterion.gs`: primeira regra de decisão.

`CriteriaService` lê as estatísticas por `StatisticsRepository`, as configurações por `CriteriaRepository` e cria um `CriteriaContext` para a engine. A engine não acessa planilhas. O contexto já reserva espaço para histórico opcional e metadados, sem tornar o Histórico uma dependência da Sprint 3.

Cada critério possui um `CriterionDefinition` com ID, nome, descrição, versão e prioridade. O registry e a engine respeitam a prioridade crescente de execução. O resultado pode ser agrupado por dezena em `NumberAnalysis`, preparando o Score Engine sem calcular score nesta sprint.

## Lowest Sequence Criterion

1. Ordena as frequências distintas em ordem decrescente.
2. Identifica sequências consecutivas de no mínimo três frequências.
3. Aprova a(s) dezena(s) cuja frequência seja o menor valor de cada sequência.
4. Atribui exatamente o peso configurado na aba `Critérios`.

Exemplos: `320, 319, 318, 317, 315` seleciona `317`; `320, 318, 316, 314` não seleciona nenhuma frequência; duas sequências elegíveis geram uma seleção por sequência.

## Fora do escopo

- Cálculo de score, geração de jogos, bolões, API Mega-Sena e critérios além de Lowest Sequence.
- Persistência de resultados para score; ela será definida junto ao Score Engine na Sprint 4.
- Contexto de critérios, prioridade de execução, agregação por dezena e metadados versionáveis de critérios.
