# Criteria

Critérios são regras de decisão plugáveis que recebem `CriteriaContext` e produzem `CriterionResult` para cada `Statistic`.

Cada implementação expõe uma `CriterionDefinition` com ID, descrição, versão e prioridade. O `CriteriaRegistry` registra as implementações, enquanto a `CriteriaEngine` executa os critérios ativos na ordem de prioridade.

Os resultados podem ser agrupados por dezena com `NumberAnalysis`. O cálculo de score continua fora desta camada.
