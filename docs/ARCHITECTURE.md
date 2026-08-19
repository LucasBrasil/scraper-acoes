# Arquitetura inicial

## Visão geral

O MS Analytics é orientado por engines. A lógica de análise, critérios, pontuação, jogos, orçamento e bolão não depende diretamente da interface do Google Sheets nem da API do Google Apps Script.

```text
Google Sheets / Apps Script
     │
     ▼
ui → services            Interface e orquestração de casos de uso
     │
     ▼
engine                   Algoritmos centrais do MS Analytics
     │
     ├────────────► analysis / strategies
     │
     ▼
domain                   Modelos e regras de negócio puras
     │
     ▼
contracts ◄────────────► repository → infra
                         Persistência e APIs externas
```

## Diretórios

| Diretório | Responsabilidade |
| --- | --- |
| `apps-script/src/ui` | Pontos de entrada do Apps Script, menus e gatilhos. |
| `apps-script/src/services` | Coordenação de fluxos de aplicação. |
| `apps-script/src/domain` | Modelos e regras de negócio sem dependência da plataforma. |
| `apps-script/src/domain/models` | Entidades centrais, como concurso, jogo, estatística, critério e orçamento. |
| `apps-script/src/domain/valueObjects` | Valores imutáveis e conceitos sem identidade própria. |
| `apps-script/src/engine` | Algoritmos que transformam o domínio: estatísticas, critérios, score, jogos, orçamento e bolão. |
| `apps-script/src/analysis` | Analisadores especializados, como frequência, atraso, janelas, ranking, sequência, score e cobertura. |
| `apps-script/src/strategies` | Estratégias plugáveis para seleção e geração de jogos. |
| `apps-script/src/infra` | Comunicação com Google Sheets e demais recursos externos. |
| `apps-script/src/repository` | Implementações de leitura e escrita que cumprem os contratos do domínio. |
| `apps-script/src/contracts` | Interfaces que desacoplam engines e serviços da tecnologia de persistência. |
| `apps-script/src/dto` | Objetos de transporte entre engines, serviços e repositórios de apresentação. |
| `apps-script/src/criteria` | Critérios plugáveis e o motor de decisão que os coordena. |
| `apps-script/src/score` | Cálculo rastreável de score e ranking a partir de `NumberAnalysis`. |
| `apps-script/src/ranking` | Classificação de scores por estratégias independentes da infraestrutura. |
| `apps-script/src/selection` | Seleção de candidatas a jogos a partir do ranking, sem gerar jogos. |
| `apps-script/src/pipeline` | Orquestração operacional, contexto, resultado e logs de uma execução completa. |
| `apps-script/src/config` | Constantes e configuração não sensível. |
| `apps-script/src/shared` | Utilitários técnicos reutilizáveis. |
| `apps-script/appsscript.json` | Manifesto do projeto Apps Script. |
| `sheets/templates` | Modelos de planilha e documentação associada. |
| `sheets/specs` | Contratos de abas, colunas, validações e fórmulas. |
| `tests/unit` | Testes de componentes isolados. |
| `tests/integration` | Testes de integrações e fluxos entre camadas. |
| `tests/fixtures` | Dados de teste sem informações sensíveis. |

## Regras de dependência

- `ui` pode chamar `services`; não acessa engines ou repositórios diretamente.
- `services` orquestra engines e usa contratos de persistência.
- `engine`, `analysis` e `strategies` dependem apenas de `domain`, `shared` e `contracts`.
- `repository` implementa `contracts` e pode usar `infra`.
- `infra` contém detalhes de Google Sheets, Apps Script e APIs, sem regras de negócio.
- `domain` não importa módulos de Apps Script, planilhas, rede ou repositórios.
- Dependências fluem para o núcleo: interface → serviços → engines/domínio → contratos; a infraestrutura aponta para dentro.

## Decisões para implementação futura

- O projeto pode usar `clasp` para sincronizar o conteúdo de `apps-script/` com o Apps Script.
- Segredos, IDs de planilhas e credenciais não pertencem ao repositório; devem ser definidos no ambiente seguro apropriado.
- Contratos de dados precisam ser registrados em `sheets/specs/` antes de qualquer automação que os consuma.
- A primeira implementação de persistência usará Google Sheets, mas engines e serviços não devem depender dela diretamente.
