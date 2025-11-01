# Sistema de Error Handling e Logging

## 📋 Overview

Sistema robusto e centralizado de tratamento de erros e logging estruturado para APIs.

## 🎯 Funcionalidades

### Error Handling
- ✅ Classes de erro tipadas e específicas
- ✅ Tratamento automático de erros MySQL
- ✅ Tratamento de erros de validação Zod
- ✅ Mensagens de erro amigáveis ao usuário
- ✅ Stack traces em desenvolvimento
- ✅ Wrapper assíncrono para routes

### Logging
- ✅ Logs estruturados (JSON em produção)
- ✅ Múltiplos níveis (ERROR, WARN, INFO, DEBUG, TRACE)
- ✅ Context logging (userId, requestId, etc.)
- ✅ Child loggers para escopo
- ✅ Timing de execução
- ✅ Logs de queries de database
- ✅ Logs de eventos de autenticação

## 🚀 Como Usar

### 1. Error Handling Básico

```typescript
import { asyncHandler, NotFoundError, ValidationError } from '@/lib/errorHandler'
import { NextRequest } from 'next/server'

// Opção 1: Usar asyncHandler (recomendado)
export const GET = asyncHandler(async (request: NextRequest) => {
  const user = await findUser(id)
  
  if (!user) {
    throw new NotFoundError('User')
  }
  
  return NextResponse.json({ user })
}, 'GET /api/users/[id]')

// Opção 2: Try-catch manual com handleError
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    if (!data.email) {
      throw new ValidationError('Email is required')
    }
    
    // ... sua lógica
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return handleError(error, 'POST /api/users')
  }
}
```

### 2. Tipos de Erros Disponíveis

```typescript
import {
  AppError,              // Erro base
  ValidationError,       // 400 - Erro de validação
  AuthenticationError,   // 401 - Não autenticado
  AuthorizationError,    // 403 - Sem permissão
  NotFoundError,         // 404 - Recurso não encontrado
  ConflictError,         // 409 - Conflito (ex: duplicado)
  DatabaseError          // 500 - Erro de database
} from '@/lib/errorHandler'

// Exemplos de uso
throw new ValidationError('Email inválido', { field: 'email' })
throw new AuthenticationError() // usa mensagem padrão
throw new AuthorizationError('Apenas admins podem fazer isso')
throw new NotFoundError('Usuário')
throw new ConflictError('Email já cadastrado')
throw new DatabaseError('Falha ao salvar', { query: 'INSERT...' })
```

### 3. Logging Básico

```typescript
import { logger } from '@/lib/utils'

// Diferentes níveis
logger.error('Erro crítico', error, { userId: 123 })
logger.warn('Atenção: recurso quase esgotado', { usage: '95%' })
logger.info('Usuário fez login', { userId: 123 })
logger.debug('Query executada', { sql: 'SELECT...' })
logger.trace('Detalhes muito verbosos')

// Logs específicos
logger.request('GET', '/api/users')
logger.response('GET', '/api/users', 200, 150) // 150ms
logger.query('SELECT * FROM users WHERE id = ?', [123], 45) // 45ms
logger.auth('login', 123, { ip: '192.168.1.1' })
logger.event('payment_completed', { amount: 100, userId: 123 })
```

### 4. Child Logger (Context)

```typescript
import { logger } from '@/lib/utils'

// Criar logger com context
const userLogger = logger.child({ userId: 123, requestId: 'abc' })

// Todos os logs incluirão userId e requestId
userLogger.info('Processando pagamento')
userLogger.error('Pagamento falhou', error)

// Limpar context
logger.clearContext()
```

### 5. Timing de Execução

```typescript
import { logger } from '@/lib/utils'

// Medir tempo automaticamente
const result = await logger.time('processPayment', async () => {
  // sua lógica aqui
  return await processPayment()
})

// Log automático: "processPayment completed { duration: '1234ms' }"
```

### 6. Exemplo Completo de Rota

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { asyncHandler, NotFoundError, AuthenticationError } from '@/lib/errorHandler'
import { logger } from '@/lib/utils'
import pool from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

export const GET = asyncHandler(async (request: NextRequest, { params }) => {
  // 1. Autenticação
  const user = await getUserFromRequest(request)
  if (!user) {
    throw new AuthenticationError()
  }

  // 2. Logger com context
  const requestLogger = logger.child({ userId: user.id })
  requestLogger.info('Fetching user profile')

  // 3. Query com timing
  const [rows] = await logger.time('getUserProfile', async () => {
    return await pool.query<RowDataPacket[]>(
      'SELECT * FROM users WHERE id = ?',
      [user.id]
    )
  })

  // 4. Validação
  if (!rows.length) {
    throw new NotFoundError('User')
  }

  // 5. Evento de negócio
  logger.event('profile_viewed', { userId: user.id })

  // 6. Resposta de sucesso
  return NextResponse.json({ success: true, data: rows[0] })
}, 'GET /api/profile')
```

## 🔧 Configuração

### Variáveis de Ambiente

```env
# Nível de log (ERROR, WARN, INFO, DEBUG, TRACE)
LOG_LEVEL=INFO

# Ambiente
NODE_ENV=development
```

### Níveis de Log

- **ERROR**: Apenas erros críticos
- **WARN**: Avisos + erros
- **INFO**: Informações gerais + acima (padrão)
- **DEBUG**: Debugging detalhado + acima
- **TRACE**: Tudo (muito verboso)

## 📊 Formato de Logs

### Desenvolvimento (Human-readable)
```
[01/11/2025 14:30:15] [INFO] GET /api/users
  Context: {"userId":123,"requestId":"abc-123"}
  Metadata: {"duration":"150ms"}
```

### Produção (JSON)
```json
{
  "timestamp": "2025-11-01T14:30:15.123Z",
  "level": "INFO",
  "message": "GET /api/users",
  "context": {"userId":123,"requestId":"abc-123"},
  "metadata": {"duration":"150ms"}
}
```

## 🎨 Boas Práticas

### ✅ Faça
- Use `asyncHandler` em todas as rotas
- Lance erros específicos (ValidationError, NotFoundError, etc.)
- Adicione context aos logs importantes
- Use `logger.time()` para operações críticas
- Log eventos de negócio importantes

### ❌ Não Faça
- Não use `console.log()` diretamente
- Não exponha detalhes internos em produção
- Não logue informações sensíveis (senhas, tokens)
- Não faça log excessivo (performance)

## 🔐 Segurança

- Stack traces apenas em desenvolvimento
- Tokens/senhas nunca são logados
- Mensagens de erro genéricas em produção
- IPs e user agents são sanitizados

## 📝 Migrando Código Existente

### Antes
```typescript
export async function GET(request: NextRequest) {
  try {
    const data = await getData()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### Depois
```typescript
import { asyncHandler } from '@/lib/errorHandler'
import { logger } from '@/lib/utils'

export const GET = asyncHandler(async (request: NextRequest) => {
  logger.info('Fetching data')
  const data = await getData()
  return NextResponse.json({ success: true, data })
}, 'GET /api/data')
```

---

**Criado em**: 2025-11-01  
**Versão**: 1.0.0

