# Decisões de arquitetura

## ADR-001 — Engines como núcleo do MS Analytics

**Status:** aceita

As engines concentram os algoritmos do produto. Elas recebem modelos de domínio e devolvem resultados de domínio, sem depender de planilhas, menus ou APIs.

As engines inicialmente previstas são:

- `StatisticsEngine`
- `CriteriaEngine`
- `ScoreEngine`
- `GamesEngine`
- `BudgetEngine`
- `BolaoEngine`

## ADR-002 — Persistência por contratos e repositórios

**Status:** aceita

O restante da aplicação acessa dados por contratos. Repositórios implementam esses contratos usando Google Sheets inicialmente. Essa separação permite migrar a persistência sem alterar engines, análises ou serviços.

## ADR-003 — Estratégias e analisadores plugáveis

**Status:** aceita

Análises especializadas ficam em `analysis/`. Estratégias de seleção ou geração ficam em `strategies/`. Novas alternativas podem ser adicionadas sem modificar o núcleo das engines.

Os analisadores atuais são `FrequencyAnalyzer`, `DelayAnalyzer`, `WindowAnalyzer` e `RankingAnalyzer`. Evoluções previstas: `SequenceAnalyzer` na Sprint 3 e `TrendAnalyzer` em sprint futura.

## ADR-004 — Criação futura de estatísticas por factory

**Status:** implementada parcialmente na Sprint 3

Atualmente, `StatisticsEngine` coordena os analisadores e monta os objetos `Statistic`, o que é adequado ao escopo atual. Quando o modelo acumular mais fontes de análise ou regras de construção, a responsabilidade será extraída para `StatisticFactory`, mantendo a engine focada exclusivamente na orquestração.

## ADR-005 — Evolução planejada da Criteria Engine

**Status:** proposta futura

As seguintes extensões foram introduzidas sem ampliar as regras de decisão:

- `CriteriaContext`: contexto de avaliação com estatísticas, configurações, histórico opcional e metadados; evita alterar a assinatura dos critérios quando novas fontes forem necessárias.
- Prioridade de critério: `CriteriaRegistry` e `CriteriaEngine` ordenam critérios por prioridade para apoiar dependências explícitas entre avaliações.
- `NumberAnalysis`: agregador de todos os `CriterionResult` de uma dezena, preparando a entrada do Score Engine. O campo `score` permanece sem cálculo.
- `CriterionDefinition`: metadados versionáveis (`id`, nome, descrição e versão) para exibição no dashboard e rastreabilidade das regras.

Enquanto os critérios forem independentes e dependerem apenas de `Statistic`, a interface atual permanece intencionalmente enxuta.
