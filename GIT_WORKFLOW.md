# Padrão Oficial de Trabalho com Git - AcheiUmPro

Este documento descreve o fluxo de trabalho padrão para desenvolvimento no projeto AcheiUmPro. Todos os membros da equipe devem seguir estas diretrizes para manter a qualidade e organização do código.

## Regras Fundamentais

1. **Nunca faça commit diretamente na branch `main`**
2. **Cada branch deve conter apenas uma feature**
3. **Todo código deve passar por revisão antes do merge**
4. **Sempre mantenha sua branch atualizada com `develop`**

## Fluxo de Trabalho

### 1. Atualize a branch develop

Sempre comece atualizando sua branch `develop` local:

```bash
git checkout develop
git pull origin develop
```

### 2. Crie uma nova branch para sua feature

Crie uma branch específica para a funcionalidade que irá desenvolver:

```bash
git checkout -b feature/nome-da-feature
```

Use prefixos adequados para o tipo de trabalho:
- `feature/` - Para novas funcionalidades
- `fix/` - Para correções de bugs
- `refactor/` - Para refatorações de código
- `docs/` - Para atualizações de documentação
- `test/` - Para adição ou modificação de testes

### 3. Desenvolva a funcionalidade

Trabalhe na implementação da funcionalidade na sua branch.

### 4. Faça commits seguindo o padrão Conventional Commits

```bash
git add .
git commit -m "feat: descreva claramente a mudança"
```

### 5. Mantenha sua branch atualizada

Antes de enviar suas alterações, atualize sua branch com as mudanças mais recentes da `develop`:

```bash
git pull origin develop
```

Resolva quaisquer conflitos que possam surgir.

### 6. Envie suas alterações para o repositório remoto

```bash
git push -u origin feature/nome-da-feature
```

### 7. Abra um Pull Request

Abra um Pull Request da sua branch `feature/nome-da-feature` para a branch `develop`.

## Padrão de Mensagens de Commit (Conventional Commits)

Todas as mensagens de commit devem seguir o padrão de [Conventional Commits](https://www.conventionalcommits.org/):

```
<tipo>[escopo opcional]: <descrição>

[corpo opcional]

[rodapé(s) opcional(is)]
```

### Tipos de Commit

- **feat**: Uma nova funcionalidade
- **fix**: Correção de bug
- **docs**: Alterações na documentação
- **style**: Alterações que não afetam o significado do código (espaços em branco, formatação, etc)
- **refactor**: Alteração de código que não corrige um bug nem adiciona uma funcionalidade
- **perf**: Alteração de código que melhora o desempenho
- **test**: Adição ou correção de testes
- **build**: Alterações no sistema de build ou dependências externas
- **ci**: Alterações nos arquivos de configuração de CI
- **chore**: Outras alterações que não modificam arquivos de src ou test

### Exemplos

```
feat: adiciona sistema de avaliações
fix: corrige cálculo de média das avaliações
docs: atualiza documentação da API
refactor: simplifica lógica de autenticação
```

## Processo de Revisão de Código

1. Todo Pull Request deve ser revisado por pelo menos um outro membro da equipe
2. O revisor deve verificar:
   - Qualidade do código
   - Aderência aos padrões do projeto
   - Funcionalidade correta
   - Testes adequados
3. Feedback deve ser construtivo e claro
4. O autor do PR deve responder a todos os comentários
5. Somente após aprovação o código pode ser mesclado à branch `develop`

## Resumo do Fluxo de Comandos

```bash
git checkout develop
git pull origin develop
git checkout -b feature/nome-da-feature
# Desenvolva a feature
git add .
git commit -m "feat: descreva claramente a mudança"
git pull origin develop
git push -u origin feature/nome-da-feature
# Abra Pull Request para develop
```

---

Seguindo este fluxo de trabalho, manteremos um histórico de código limpo e organizado, facilitando o desenvolvimento colaborativo e a manutenção do projeto AcheiUmPro.