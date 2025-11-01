
## 🎯 Próximos passos

1. ✅ Configuração inicial concluída
2. ⏳ Obter token do Qodana Cloud (opcional)
3. ⏳ Adicionar `QODANA_TOKEN` nos secrets do GitHub
4. ⏳ Revisar e corrigir problemas identificados
5. ⏳ Ajustar quality gates se necessário

## 📚 Links úteis

- [Documentação Qodana](https://www.jetbrains.com/help/qodana/)
- [Qodana Cloud](https://qodana.cloud/)
- [Qodana GitHub Action](https://github.com/JetBrains/qodana-action)
- [Guia de Configuração](https://www.jetbrains.com/help/qodana/qodana-yaml.html)

## 🆘 Problemas comuns

### "Qodana token não configurado"
- É opcional! Funciona sem token, mas com recursos limitados
- Para recursos completos, obtenha um token gratuito

### "Quality gate failed"
- Revise os problemas no PR ou no relatório
- Corrija os problemas críticos e de alta severidade
- Ou ajuste os limites em `qodana.yaml` se forem muito restritivos

### "Workflow falhou no CI"
- Verifique os logs do GitHub Actions
- Geralmente é problema de build ou dependências
- Execute localmente: `npm ci && npm run build`

---

**Configurado em**: 2025-01-31
**Versão do Qodana**: 2025.2
# Qodana Configuration Guide

## 📋 Overview

Este projeto está configurado com **Qodana** da JetBrains para análise automática de qualidade de código em JavaScript, TypeScript, React e Next.js.

## 🚀 O que foi configurado

### 1. **Qodana Analysis** (`qodana.yaml`)
- ✅ Linter: `jetbrains/qodana-js:2025.2`
- ✅ Profile: `qodana.recommended`
- ✅ Análise de TypeScript, React, Next.js
- ✅ Verificação de segurança (SQL Injection, XSS, etc.)
- ✅ Detecção de código duplicado
- ✅ Análise de ESLint

### 2. **GitHub Actions Workflows**

#### **Qodana Workflow** (`.github/workflows/qodana.yml`)
- Executa em todos os PRs para `main` e `develop`
- Posta comentários automáticos nos PRs com problemas encontrados
- Gera relatórios SARIF para integração com GitHub Security

#### **CI/CD Pipeline** (`.github/workflows/ci.yml`)
- Build do projeto
- Lint (ESLint)
- Type checking (TypeScript)
- Security audit (npm audit)

### 3. **Quality Gates**
Limites de problemas permitidos:
- **Total**: 100 problemas
- **Critical**: 5 problemas
- **High**: 15 problemas
- **Moderate**: 30 problemas
- **Low**: 50 problemas

### 4. **CODEOWNERS**
- Define revisores obrigatórios para áreas críticas
- APIs, autenticação, database, configurações

## 🔧 Como usar

### Executar Qodana localmente

```bash
# Via Docker
docker run --rm -v $(pwd):/data/project jetbrains/qodana-js:2025.2

# Via CLI (após instalar qodana-cli)
qodana scan --show-report
```

### Ver relatórios

1. **No GitHub**: Acesse a aba "Security" → "Code scanning alerts"
2. **Localmente**: O relatório HTML é gerado em `.qodana/results/report/`
3. **Nos PRs**: Qodana posta comentários automaticamente

## 📊 Integrações

### GitHub Security
Os resultados são enviados para GitHub Security via SARIF, permitindo:
- Visualização de vulnerabilidades na UI do GitHub
- Rastreamento de correções
- Histórico de análises

### Pull Requests
- Comentários automáticos com problemas encontrados
- Status check obrigatório (falha se limites excedidos)
- Integração com revisão de código

## 🔐 Configuração de Segredos

Para habilitar todas as funcionalidades, configure no GitHub:

1. Acesse: `Settings` → `Secrets and variables` → `Actions`
2. Adicione (opcional, mas recomendado):
   - `QODANA_TOKEN`: Token do Qodana Cloud (gratuito)
     - Obtenha em: https://qodana.cloud/

## 📁 Arquivos excluídos da análise

Apenas arquivos gerados/vendor são excluídos:
- `node_modules/`
- `.next/`
- `dist/`, `build/`, `out/`
- Arquivos `.env*`
- Lock files (`package-lock.json`, etc.)
- `next-env.d.ts` (gerado automaticamente)

**Todo o código-fonte é analisado!**

