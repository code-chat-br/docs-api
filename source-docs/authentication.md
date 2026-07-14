# Autenticação

A API possui dois mecanismos independentes. O token global administra o cadastro de instâncias e os envios em lote; o JWT da instância autoriza conexão, mensagens individuais, chats, grupos, mídia e webhooks por instância.

## Token global

Configure `AUTHENTICATION_GLOBAL_AUTH_TOKEN` e envie um dos headers abaixo:

```http
apikey: <token-global>
```

Também são aceitos `x-api-key` e `apiKey`. `apikey` é a forma recomendada. Se mais de um alias for enviado, todos precisam ter exatamente o mesmo valor.

Rotas protegidas pelo token global:

| Método | Rota | Situação |
| --- | --- | --- |
| `POST` | `/instance` | Atual |
| `GET` | `/instance` | Atual |
| `POST` | `/instance/create` | Legada |
| `GET` | `/instance/fetchInstances` | Legada |
| `POST/GET` | `/message/batches...` | Recurso Pro de envio em lote: criação, consultas e controle do worker. |

Falhas: `401` quando o header não existe ou o token é inválido; `400` quando aliases enviados ao mesmo tempo divergem.

## Token da instância

Todas as demais rotas funcionais usam:

```http
Authorization: Bearer <jwt-da-instancia>
```

O JWT é assinado com HS256 e contém `instanceName`. O middleware compara esse claim com o nome presente na rota. Token ausente, malformado, expirado ou inválido retorna `401`; claim referente a outra instância retorna `403`.

`AUTHENTICATION_JWT_EXPIRES_IN=0` gera tokens sem `exp` e faz o validador ignorar expiração. A validação de `nbf` continua ativa.

## Exemplo

```bash
curl "http://localhost:8084/instance/codechat/connection/status" \
  -H "Authorization: Bearer $INSTANCE_TOKEN"
```

## Planos Basic e Pro

O runtime auditado não diferencia planos. Não existe claim de plano, middleware de entitlement, `402`, URL de upgrade ou bloqueio por feature. Os endpoints Pro por instância aceitam qualquer JWT de instância válido, sujeito às mesmas validações e ao estado da conexão. O recurso Pro `/message/batches...` é a exceção de autenticação: ele usa o token global administrativo descrito acima.

Consulte [Endpoints Pro](./pro-endpoints.md) para a classificação comercial e [Erros](./errors.md) para o envelope real.
