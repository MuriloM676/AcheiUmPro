# Como corrigir PR que foi para main em vez de develop

Se você já abriu um PR e ele foi para `main` por engano, siga estes passos:

## Opção 1: Fechar e reabrir (Recomendado)

1. **Fechar o PR atual** (não fazer merge!)
2. **Ir até a lista de PRs** no GitHub
3. **Clicar em "New Pull Request"**
4. **Selecionar as branches corretas:**
   - Base: `develop` ← (aqui que você quer mergear)
   - Compare: `feature/sua-branch` ← (sua branch de trabalho)
5. **Criar o PR**

## Opção 2: Editar PR existente (Mais rápido)

1. **Abrir o PR que está errado**
2. **Clicar em "Edit" ao lado do título**
3. **Clicar no dropdown da base branch** (onde mostra `base: main`)
4. **Selecionar `develop`** na lista
5. **Salvar**

## Como evitar esse problema

### Ao criar PR pela primeira vez

Quando você faz `git push` e o GitHub sugere criar um PR:
1. **NÃO** clicar direto no botão verde
2. **Verificar** qual branch está sendo sugerida como base
3. **Se estiver `main`, trocar para `develop`** antes de criar

### Ao usar GitHub CLI

```bash
# Cria PR para develop automaticamente
gh pr create --base develop --fill
```

### Ao usar interface web

URL padrão quando você faz push:
```
https://github.com/MuriloM676/AcheiUmPro/compare/main...feature/sua-branch
                                                        ^^^^
                                                   mude isso para develop
```

Vire:
```
https://github.com/MuriloM676/AcheiUmPro/compare/develop...feature/sua-branch
```

## Por que isso acontece?

O repositório GitHub está configurado com `main` como branch padrão. Isso significa:
- Quando alguém clona o repo → vai para `main`
- Quando cria um PR → sugere merge para `main`
- A página inicial do repo → mostra a branch `main`

**Solução ideal (requer permissão de admin no GitHub):**
Mudar a branch padrão do repositório para `develop`:
1. Settings → Branches
2. Default branch → Trocar para `develop`
3. Update

Mas até isso ser feito, **sempre verificar a base do PR manualmente**.

## Checklist rápido antes de criar PR

- [ ] Minha branch está atualizada com develop? (`git pull origin develop`)
- [ ] Fiz commit de todas as mudanças?
- [ ] A base do PR está em `develop`? (não `main`)
- [ ] O título do PR é descritivo?
- [ ] Adicionei descrição explicando o que foi feito?

