# Convenções do projeto

## Código

- Usar nomes claros em inglês para arquivos, funções e variáveis de código.
- Usar `camelCase` para funções e variáveis, e `PascalCase` para entidades e classes.
- Manter funções pequenas, com uma responsabilidade bem definida.
- Evitar acesso direto ao Apps Script fora da camada `infra` e dos pontos de entrada em `ui`.

## Documentação

- Registrar mudanças relevantes em `CHANGELOG.md`.
- Documentar decisões arquiteturais que alterem responsabilidades ou dependências.
- Especificar abas e colunas em `sheets/specs/` antes de consumi-las no código.

## Testes

- Incluir testes unitários para regras de domínio quando elas forem adicionadas.
- Usar fixtures anonimizadas e determinísticas.
- Separar testes de integração dos testes unitários.
