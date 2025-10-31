#!/usr/bin/env node
const { execSync } = require('child_process')

function currentBranch() {
  try {
    const out = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim()
    return out
  } catch (err) {
    console.error('Erro ao detectar branch atual:', err.message || err)
    process.exit(1)
  }
}

const forbidden = ['main', 'develop']
const branch = currentBranch()

if (forbidden.includes(branch)) {
  console.error(`Commit proibido: você está na branch '${branch}'.`)
  console.error("Por favor crie uma branch de feature/bugfix a partir de 'develop' (ou 'main' quando for release) e faça commits nela.")
  console.error("Exemplo: git checkout -b feature/minha-melhora")
  process.exit(1)
}

process.exit(0)

