1. Atualizar branches locais

git checkout main # Mudar para a branch main
git pull origin main # Puxar as últimas mudanças da main

git checkout develop # Mudar para a branch develop
git pull origin develop # Puxar as últimas mudanças da develop

2. Criar uma nova branch de feature 

git checkout develop # Certificar-se de estar na develop
git pull origin develop # Puxar as últimas mudanças da develop
git checkout -b feature/nome-da-feature # Criar e mudar para a nova branch de feature

3. Desenvolver e versionar o código

Apos desenvolver:
git add . # Adicionar todas as mudanças
git commit -m "Descrição clara do que foi feito" # Fazer o commit das mudanças

4. Subir a branch para o repositório remoto

git push -u origin feature/nome-da-feature # Subir a branch de feature para o remoto

5. Abrir um Pull Request (PR)

- Vá até o repositório no GitHub/GitLab/Bitbucket 
- Crie um novo Pull Request da branch feature/nome-da-feature para develop
- Adicione revisores e uma descrição detalhada do que foi implementado

6. Após o PR ser aceito

git checkout develop # Mudar para a branch develop
git pull origin develop # Puxar as últimas mudanças da develop

7. Atualizar a main com a develop (quando estável)

git checkout main # Mudar para a branch main
git pull origin main # Puxar as últimas mudanças da main
git merge origin/develop # Mesclar develop na main
git push origin main # Subir as mudanças para o remoto

8. Sincronizar tudo localmente

git checkout develop # Mudar para a branch develop
git pull origin develop # Puxar as últimas mudanças da develop

git checkout main # Mudar para a branch main
git pull origin main # Puxar as últimas mudanças da main

9. Deletar a branch de feature local e remotamente

git branch -d feature/nome-da-feature
git push origin --delete feature/nome-da-feature

