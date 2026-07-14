# Erros

## Envelope real

Os handlers HTTP retornam erros JSON neste formato:

```json
{
  "statusCode": 400,
  "error": "bad-request",
  "code": "optional-machine-code",
  "messages": ["descrição do problema"]
}
```

| Campo | Tipo | Regra |
| --- | --- | --- |
| `statusCode` | integer | Mesmo status HTTP da resposta. |
| `error` | string | Identificador kebab-case, como `bad-request` ou `service-unavailable`. |
| `code` | string | Opcional; aparece em erros específicos de fila e `mentionAll`. |
| `messages` | string[] | Uma ou mais mensagens. |

Fora do Message Batch, o envelope não contém `message` singular, `details`, `requestId` ou `timestamp`.

### Exceção do Message Batch

Validações, recursos ausentes, autorização de uma instância selecionada e transições das rotas `/message/batches...` usam `message` singular, ainda como array:

```json
{
  "statusCode": 422,
  "error": "unprocessable-entity",
  "message": ["recipients[3] não pode ser um grupo"]
}
```

Rejeições do middleware Bearer de usuário (`401` por token ausente, inválido, expirado ou sem `userId` UUID) acontecem antes do handler de lote e continuam usando o envelope geral com `messages`. Falhas internas `500` também usam o envelope geral. O OpenAPI representa os dois formatos possíveis no `400` do Message Batch.

## Status observados

| Status | Uso principal |
| --- | --- |
| `400` | JSON inválido, campos desconhecidos, parâmetros incompatíveis ou validação comum. |
| `401` | Credencial ausente, malformada ou inválida. |
| `403` | JWT válido, mas de outra instância. |
| `404` | Instância, mensagem, upload, grupo ou recurso não encontrado. |
| `406` | Mensagem enviada ao WhatsApp, mas não persistida na base local. |
| `408` | Timeout de conexão ou operação WhatsApp. |
| `409` | Nome duplicado, conexão em andamento ou transição de pedido inválida. |
| `410` | Challenge de passkey expirado. |
| `413` | Upload ou download maior que o limite. |
| `415` | Tipo de mídia não suportado. |
| `422` | Regra semântica inválida, especialmente pedido, passkey e criação de instância. |
| `500` | Falha interna. |
| `503` | Banco, sessão ou WhatsApp indisponível. |

O conversor interno conhece `429`, mas a aplicação não registra rate limiter nem um produtor desse status. Não há `402` no runtime atual.

## Inconsistências conhecidas

- Ao excluir uma instância com dependências sem `force=true`, o repositório produz um erro de dependências, mas o mapeador HTTP não o reconhece; a resposta atual cai em `500` em vez de um status de conflito.
- O endpoint atual de logout tem dois parâmetros: `/instance/:instance/logout/:instanceName`. O middleware e o handler preferem `:instanceName`; por isso o token é comparado com o segundo valor.
- `GET /instance/:instance/connection/status` pode responder HTTP `200` com `state: "close"` e `statusReason: 503`; esse número faz parte do payload e não muda o status HTTP.
- O código possui uma enumeração interna para `429`, mas não existe limitação de taxa registrada.
