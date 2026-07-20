# Configuração de ambiente

<a className="installation-video-card" href="https://youtu.be/DrgExUydhl8" target="_blank" rel="noreferrer">
  <span className="installation-video-cover">
    <img
      src="https://i.ytimg.com/vi/DrgExUydhl8/maxresdefault.jpg"
      alt="Capa da aula Como Instalar a CodeChat API WhatsApp em Go"
    />
  </span>
  <span className="installation-video-copy">
    <strong>Como Instalar a CodeChat API WhatsApp em Go | Guia Completo</strong>
    <span>Neste vídeo, você vai aprender a instalar e executar a CodeChat API WhatsApp em Go.</span>
    <span className="installation-video-host">youtu.be</span>
  </span>
</a>

<EnvironmentVariablesSection />

## Execução local

```bash
cp .env.dev .env
go run ./cmd/...
```

Quando `DOCKER_ENV` está ausente ou definido como `false`, a aplicação carrega `.env` e depois lê os valores do ambiente do processo. Variáveis já definidas no processo têm prioridade sobre os valores em `.env`.

`.env.dev` é um arquivo de referência para desenvolvimento local e não é carregado automaticamente.

## Store de sessão do Whatsmeow

`DATABASE_URL` continua sendo o banco principal da API. `WHATSAPP_SESSION_POSTGRES_URL` é opcional e é usado somente pelo SQL store do whatsmeow quando estiver preenchido. Os repositórios da API e as migrations sempre usam `DATABASE_URL`.

O SQLite armazena sessões em um arquivo local e exige armazenamento persistente em containers. O DSN padrão mantém as chaves estrangeiras do SQLite habilitadas:

```env
WHATSAPP_SESSION_STORE="sqlite"
WHATSAPP_SESSION_SQLITE_DSN="file:./data/whatsmeow.db?_foreign_keys=on"
WHATSAPP_SESSION_POSTGRES_URL=""
```

Quando Postgres é selecionado e `WHATSAPP_SESSION_POSTGRES_URL` está vazio, o whatsmeow usa o mesmo servidor/banco PostgreSQL configurado em `DATABASE_URL`, mas ainda com sua própria conexão SQL e seu próprio ciclo de vida:

```env
DATABASE_URL="postgresql://api:password@postgres:5432/codechat"

WHATSAPP_SESSION_STORE="postgres"
WHATSAPP_SESSION_POSTGRES_URL=""
```

Quando `WHATSAPP_SESSION_POSTGRES_URL` está preenchido, as sessões do whatsmeow são inicializadas e migradas somente nesse banco dedicado. A aplicação não volta para `DATABASE_URL` se a URL dedicada estiver inválida ou indisponível:

```env
DATABASE_URL="postgresql://api:password@postgres:5432/codechat"

WHATSAPP_SESSION_STORE="postgres"
WHATSAPP_SESSION_POSTGRES_URL="postgresql://sessions:password@postgres:5432/codechat_sessions"
```

Alterar `WHATSAPP_SESSION_STORE` não migra sessões existentes automaticamente. Os dispositivos só ficam disponíveis no novo backend se os dados do whatsmeow tiverem sido migrados antes; caso contrário, pode ser necessário parear as instâncias novamente. O backend anterior não é apagado.

## Instalação com Docker

As imagens oficiais estão disponíveis no [Docker Hub](https://hub.docker.com/r/codechat/whatsapp-go-api):

- Imagem padrão: **codechat/whatsapp-go-api**
- Imagem Pro: **codechat/whatsapp-go-api:pro-1.0.0**

A partir do diretório que contém a pasta `whatsapp-go-api`, inicie a API com o arquivo Compose do projeto:

```bash
docker compose -f whatsapp-go-api/docker-compose.yml up -d
```

Para usar a imagem Pro, altere o campo `image` do serviço em `whatsapp-go-api/docker-compose.yml` para `codechat/whatsapp-go-api:pro-1.0.0` antes de executar o comando.

### Variáveis do container

As variáveis precisam ser fornecidas diretamente ao container:

```yaml
environment:
  SERVER_PORT: "${SERVER_PORT}"
  LOG_LEVEL: "${LOG_LEVEL}"
  DATABASE_URL: "${DATABASE_URL}"
  DATABASE_SAVE_DATA_NEW_MESSAGE: "${DATABASE_SAVE_DATA_NEW_MESSAGE:-true}"
  DATABASE_SAVE_MESSAGE_UPDATE: "${DATABASE_SAVE_MESSAGE_UPDATE:-false}"
  DATABASE_SAVE_DATA_CONTACTS: "${DATABASE_SAVE_DATA_CONTACTS:-false}"
  WHATSAPP_SESSION_STORE: "${WHATSAPP_SESSION_STORE:-postgres}"
  WHATSAPP_SESSION_SQLITE_DSN: "${WHATSAPP_SESSION_SQLITE_DSN:-file:./data/whatsmeow.db?_foreign_keys=on}"
  WHATSAPP_SESSION_POSTGRES_URL: "${WHATSAPP_SESSION_POSTGRES_URL:-}"
  WEBHOOK_GLOBAL_URL: "${WEBHOOK_GLOBAL_URL:-}"
  WEBHOOK_GLOBAL_ENABLED: "${WEBHOOK_GLOBAL_ENABLED:-false}"
  AUTHENTICATION_JWT_EXPIRES_IN: "${AUTHENTICATION_JWT_EXPIRES_IN}"
  AUTHENTICATION_JWT_SECRET: "${AUTHENTICATION_JWT_SECRET}"
  AUTHENTICATION_GLOBAL_AUTH_TOKEN: "${AUTHENTICATION_GLOBAL_AUTH_TOKEN}"
  QRCODE_LIMIT: "${QRCODE_LIMIT}"
  QRCODE_EXPIRATION_TIME: "${QRCODE_EXPIRATION_TIME}"
  QRCODE_LIGHT_COLOR: "${QRCODE_LIGHT_COLOR}"
  QRCODE_DARK_COLOR: "${QRCODE_DARK_COLOR}"
  CONFIG_SESSION_PHONE_CLIENT: "${CONFIG_SESSION_PHONE_CLIENT:-DESKTOP}"
  CONFIG_SESSION_PHONE_NAME: "${CONFIG_SESSION_PHONE_NAME:-CodeChat}"
  WHATSAPP_PAIRING_TIMEOUT: "${WHATSAPP_PAIRING_TIMEOUT}"
  WHATSAPP_AUTO_RECONNECT: "${WHATSAPP_AUTO_RECONNECT}"
  WHATSAPP_STARTUP_RECONNECT_CONCURRENCY: "${WHATSAPP_STARTUP_RECONNECT_CONCURRENCY}"
  WHATSAPP_CONNECT_TIMEOUT: "${WHATSAPP_CONNECT_TIMEOUT}"
  WHATSAPP_RECONNECT_INITIAL_DELAY: "${WHATSAPP_RECONNECT_INITIAL_DELAY}"
  WHATSAPP_RECONNECT_MAX_DELAY: "${WHATSAPP_RECONNECT_MAX_DELAY}"
  WHATSAPP_PROFILE_PICTURE_TIMEOUT: "${WHATSAPP_PROFILE_PICTURE_TIMEOUT}"
  WHATSAPP_ADDRESS_CACHE_TTL: "${WHATSAPP_ADDRESS_CACHE_TTL:-168h}"
  MESSAGE_PROCESSING_WORKERS: "${MESSAGE_PROCESSING_WORKERS:-4}"
  MESSAGE_PROCESSING_QUEUE_SIZE: "${MESSAGE_PROCESSING_QUEUE_SIZE:-100}"
  MESSAGE_PROCESSING_TIMEOUT: "${MESSAGE_PROCESSING_TIMEOUT:-60s}"
  MESSAGE_GROUP_INFO_TIMEOUT: "${MESSAGE_GROUP_INFO_TIMEOUT:-30s}"
  MESSAGE_SEND_TIMEOUT: "${MESSAGE_SEND_TIMEOUT:-30s}"
  MESSAGE_BATCH_WORKER_ENABLED: "${MESSAGE_BATCH_WORKER_ENABLED:-true}"
  MESSAGE_BATCH_WORKER_POLL_INTERVAL_MS: "${MESSAGE_BATCH_WORKER_POLL_INTERVAL_MS:-1000}"
  MESSAGE_BATCH_INSTANCE_RECHECK_INTERVAL_MS: "${MESSAGE_BATCH_INSTANCE_RECHECK_INTERVAL_MS:-5000}"
  MESSAGE_BATCH_MAX_DELAY_MS: "${MESSAGE_BATCH_MAX_DELAY_MS:-86400000}"
  MESSAGE_BATCH_MAX_RECIPIENTS: "${MESSAGE_BATCH_MAX_RECIPIENTS:-10000}"
  MESSAGE_BATCH_SHUTDOWN_TIMEOUT_MS: "${MESSAGE_BATCH_SHUTDOWN_TIMEOUT_MS:-15000}"
  MESSAGE_BATCH_TIMEZONE: "${MESSAGE_BATCH_TIMEZONE:-UTC}"
```

Quando `DOCKER_ENV=true`, `.env` e `.env.dev` não são carregados.

Se `WHATSAPP_SESSION_STORE=sqlite`, monte um volume persistente para o diretório do SQLite. Para o DSN padrão, persista `/app/data` ou o caminho equivalente `data` do diretório de trabalho usado pela imagem:

```yaml
volumes:
  - whatsmeow_sessions:/app/data
```

`AUTHENTICATION_GLOBAL_AUTH_TOKEN` autentica `POST /instance`, `GET /instance` e os aliases legados `POST /instance/create` e `GET /instance/fetchInstances`. Ele não autentica `GET /instance/:instance`, `GET /instance/fetchInstance/:instanceName`, `PUT /instance/refreshToken/:instanceName` nem as rotas `/message/batches...`.

As rotas `/message/batches...` usam `Authorization: Bearer <jwt-do-usuario>`. Esse JWT precisa conter `userId` em formato UUID e `exp`; a expiração não é ignorada nesse fluxo.

O endpoint de refresh exige `Authorization: Bearer <token>` e o mesmo JWT atual no campo `oldToken` do corpo da requisição. Ele rotaciona o `Auth.token` armazenado para aquela instância, invalida imediatamente o token antigo e não representa um segundo tipo de refresh-token.

`AUTHENTICATION_JWT_EXPIRES_IN=0` remove completamente a claim `exp`. Ele não gera `exp: 0`.

Não use segredos de desenvolvimento em produção. JWTs, chaves de API, tokens globais, URLs de banco e segredos não devem ser escritos em logs.

`GET /instance/:instance/connect` retorna o primeiro QR code do WhatsApp como código bruto mais um PNG `data:image/png;base64,...` gerado com as cores de QR configuradas. O alias legado `GET /instance/connect/:instanceName` permanece ativo. O processo de pareamento continua depois da resposta HTTP e usa `WHATSAPP_PAIRING_TIMEOUT` como deadline total do contexto.

`GET /instance/:instance/connect/code/:phoneNumber` retorna exatamente o código de pareamento do Whatsmeow. O alias legado mantém o formato `/instance/connect/:instanceName/code/:phoneNumber`. Números de telefone são normalizados para dígitos antes de chamar o Whatsmeow.

Os dois endpoints de conexão exigem o bearer token da instância armazenado em `Auth.token`; o token global de admin não é aceito.

`CONFIG_SESSION_PHONE_CLIENT` e `CONFIG_SESSION_PHONE_NAME` são aplicados uma vez durante a inicialização, antes da criação do SQL Store e dos clientes do Whatsmeow. Eles afetam somente novos vínculos. Dispositivos já vinculados não são apagados, deslogados nem reescritos automaticamente; para ver um novo rótulo, desconecte a instância pelo fluxo existente, remova o dispositivo vinculado no telefone, reinicie a aplicação, gere um novo QR code e vincule novamente.
