# Padrão Oficial de Trabalho com Git do Projeto AcheiUmPro

Este documento descreve o fluxo de trabalho Git que todos os membros da equipe devem seguir ao desenvolver novas funcionalidades para o projeto AcheiUmPro.

## Fluxo de Trabalho com Branches

Nosso projeto segue um modelo de desenvolvimento baseado em branches, onde:

- `main`: Branch principal que contém o código em produção
- `develop`: Branch de desenvolvimento que contém as funcionalidades prontas para o próximo release
- `feature/*`: Branches para desenvolvimento de novas funcionalidades

**Importante:** Nunca faça commit diretamente na branch `main`. Todo o desenvolvimento deve ser feito em branches específicas e integrado via Pull Requests.

## Fluxo de Comandos

Sempre siga este fluxo ao desenvolver novas funcionalidades:

```bash
# 1. Atualize a branch develop
git checkout develop
git pull origin develop

# 2. Crie uma branch específica para sua feature
git checkout -b feature/nome-da-feature

# 3. Desenvolva a funcionalidade

# 4. Adicione as alterações
git add .

# 5. Faça o commit seguindo o padrão de Conventional Commits
git commit -m "feat: descreva claramente a mudança"

# 6. Atualize sua branch com as últimas alterações da develop
git pull origin develop

# 7. Envie sua branch para o repositório remoto
git push -u origin feature/nome-da-feature
```

## Padrão de Mensagens de Commit

Utilizamos o padrão [Conventional Commits](https://www.conventionalcommits.org/) para mensagens de commit. Cada mensagem deve seguir o formato:

```
<tipo>: <descrição>

[corpo opcional]

[rodapé opcional]
```

### Tipos de Commit

- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `docs`: Alterações na documentação
- `style`: Alterações que não afetam o código (formatação, espaços em branco, etc.)
- `refactor`: Refatoração de código
- `test`: Adição ou correção de testes
- `chore`: Alterações no processo de build, ferramentas auxiliares, etc.

## Pull Requests

Após enviar sua branch para o repositório remoto, abra um Pull Request da sua branch `feature/*` para a branch `develop`.

### Regras para Pull Requests

1. Cada branch deve conter apenas uma funcionalidade
2. O título do PR deve seguir o mesmo padrão das mensagens de commit
3. Descreva claramente as alterações realizadas
4. Outro membro da equipe deve revisar o código antes do merge
5. Todos os testes devem passar antes do merge

## Revisão de Código

A revisão de código é uma etapa obrigatória para manter a qualidade do projeto. O revisor deve verificar:

1. Se o código segue os padrões do projeto
2. Se a funcionalidade está implementada corretamente
3. Se existem bugs ou problemas de segurança
4. Se a documentação foi atualizada (quando necessário)

Somente após a aprovação da revisão, o código pode ser integrado à branch `develop`.

---

Seguindo estas diretrizes, manteremos um histórico de commits limpo e organizado, facilitando a manutenção e evolução do projeto.