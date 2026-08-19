# MS Analytics

Base do projeto **MS Analytics**, voltado à organização de análises e automações integradas ao Google Sheets por meio do Google Apps Script.

## Objetivo da Sprint 1

Estabelecer a estrutura do repositório, convenções e documentação inicial. Esta etapa não inclui regras de negócio, integrações externas ou automações em produção.

## Estrutura

```text
.
├── apps-script/          # Código do Google Apps Script e configuração do projeto
├── docs/                 # Documentação de arquitetura, padrões e planejamento
├── sheets/               # Modelos, especificações e artefatos de planilhas
├── tests/                # Testes automatizados e seus recursos de apoio
├── CHANGELOG.md
├── LICENSE
└── README.md
```

Consulte [a arquitetura](docs/ARCHITECTURE.md) e o [escopo da Sprint 1](docs/SPRINT-1.md) antes de iniciar implementações.

O núcleo do sistema é composto pelas engines. Google Sheets e Apps Script são adaptadores de interface e persistência, não o centro das regras ou dos algoritmos.

## Próximos passos

1. Validar o documento de arquitetura e os contratos de dados.
2. Definir o modelo das planilhas em `sheets/`.
3. Implementar os primeiros casos de uso no Apps Script.
4. Criar e executar os testes correspondentes em `tests/`.

## Convenções iniciais

- Código do Apps Script será mantido em JavaScript moderno (`.js`).
- Cada módulo deve ter responsabilidade única e dependências explícitas.
- Regras de negócio ficam isoladas de acesso à planilha e de integrações.
- Documentação e testes acompanham cada incremento funcional.

## Sprint 2 — Statistics Engine

A primeira funcionalidade disponível é a atualização de estatísticas a partir exclusivamente da aba `Histórico`. Consulte os [detalhes da Sprint 2](docs/SPRINT-2.md) e os contratos de [Histórico](sheets/specs/HISTORICO.md) e [Estatísticas](sheets/specs/ESTATISTICAS.md).

## Sprint 3 — Criteria Engine

O motor de critérios avalia somente estatísticas geradas na Sprint 2. A primeira regra, Lowest Sequence, é habilitada e ponderada pela aba `Critérios`; veja os [detalhes da Sprint 3](docs/SPRINT-3.md) e o [contrato da aba](sheets/specs/CRITERIOS.md).

## Sprint 4 — Score Engine

O Score Engine transforma as avaliações agrupadas em score e ranking rastreáveis, atualizando a aba `Estatísticas`. Consulte os [detalhes da Sprint 4](docs/SPRINT-4.md).

## Sprint 5 — Ranking & Selection Engine

O Ranking Engine classifica os scores e o Selection Engine marca as dezenas candidatas configuradas na aba `Config`, sem gerar jogos. Consulte os [detalhes da Sprint 5](docs/SPRINT-5.md) e o [contrato de Config](sheets/specs/CONFIG.md).

## Sprint 6 — Pipeline Operacional

O item **MS Analytics → ▶ Atualizar Tudo** executa o fluxo completo, cria logs e atualiza o Dashboard MVP. Consulte os [detalhes da Sprint 6](docs/SPRINT-6.md).

## Execução com clasp

O diretório `apps-script/` é a raiz sincronizada com o Google Apps Script. Os arquivos de teste, documentação e demais artefatos locais não são enviados.

### Pré-requisitos

1. Instale o [Node.js](https://nodejs.org/).
2. Instale o clasp globalmente:

   ```bash
   npm install -g @google/clasp
   ```

3. Autentique sua conta Google:

   ```bash
   clasp login
   ```

### Vincular à planilha

1. Abra a planilha de destino no Google Sheets.
2. Acesse **Extensões → Apps Script**.
3. Em **Configurações do projeto**, copie o **ID do script**.
4. Substitua `REPLACE_WITH_YOUR_APPS_SCRIPT_PROJECT_ID` no arquivo local `.clasp.json` pelo ID copiado.

O `.clasp.json` não é versionado. Use `.clasp.json.example` como referência segura para novas máquinas.

### Sincronizar e executar

Na raiz do projeto, execute:

```bash
clasp status
clasp push
clasp open
```

Após o `push`, recarregue a planilha e conceda as permissões solicitadas. O menu **MS Analytics** ficará disponível; use **▶ Atualizar Tudo** para executar o pipeline completo.

Para atualizar o código depois de uma alteração local, execute novamente `clasp push`. Para conferir modificações feitas diretamente no editor do Apps Script antes de sobrescrever arquivos, use `clasp status` e, se necessário, `clasp pull`.

Um projeto vinculado a uma planilha não exige publicação como aplicativo web para usar o menu. Caso uma implantação seja necessária no futuro, crie uma versão e uma implantação com:

```bash
clasp version "MS Analytics"
clasp deploy --description "MS Analytics"
```
