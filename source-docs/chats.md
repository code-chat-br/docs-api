# Chats

Todas as rotas atuais usam o JWT da instância.

| Método | Rota | Body ou query | Sucesso |
| --- | --- | --- | --- |
| `POST` | `/instance/:instance/chat/is-account` | `numbers` | `200` |
| `PATCH` | `/instance/:instance/chat/read-message` | IDs ou remetente/chat/IDs | `200` |
| `PUT` | `/instance/:instance/chat/archive` | `lastMessage` e `archive` | `204` |
| `DELETE` | `/instance/:instance/chat/delete-message?id=1` | query `id` | `204` |
| `POST` | `/instance/:instance/chat/profile-picture` | destinatário | `200` |
| `POST` | `/instance/:instance/chat/reject-call` | `callId`, `callFrom` | `204` |
| `POST` | `/instance/:instance/chat/edit-message` | `id`, `text` | `200` |
| `POST` | `/instance/:instance/db/messages` | filtros e cursor opcionais | `200` |
| `POST` | `/chat/findMessages/:instanceName` | `where`, `offset`, `page` legados | `200` |

## Buscar mensagens persistidas

`POST /instance/codechat/db/messages` consulta somente o banco de dados da instancia da rota. A instancia nao precisa estar conectada ao WhatsApp; a rota nao resolve cliente WhatsApp nem valida sessao conectada.

Body vazio e valido:

```json
{}
```

Filtros opcionais:

```json
{
  "filter": {
    "keyRemoteJid": "123@s.whatsapp.net",
    "keyFromMe": "true",
    "messageType": "conversation",
    "status": "DELIVERY_ACK"
  },
  "cursor": {
    "type": "next",
    "id": 1200
  },
  "limit": 50
}
```

O limite padrao e `50`, com minimo `1` e maximo `100`. O cursor usa o ID interno da mensagem. A resposta sempre vem em `id DESC`; `next` busca IDs menores e `previous` busca IDs maiores, invertendo internamente a pagina antes de responder.

`keyFromMe` e string publica (`"true"` ou `"false"`, case-insensitive apos trim) e e convertido para booleano antes da consulta. `status` e filtrado por `MessageUpdate` com `EXISTS`, preservando mensagens sem atualizacoes quando nao ha filtro e evitando registros duplicados.

O alias legado `POST /chat/findMessages/:instanceName` permanece disponivel com `where.keyid`, `where.messageStatus`, `offset` como tamanho da pagina e `page` baseado em 1. A resposta preserva `total`, `pages`, `currentPage`, `records` e o campo legado `MessageUpdate`.

Exemplo:

```bash
curl --location --request POST \
  'http://localhost:8084/instance/codechat-01/db/messages' \
  --header 'Authorization: Bearer SEU_TOKEN' \
  --header 'Content-Type: application/json' \
  --data-raw '{
    "filter": {
      "keyRemoteJid": "123@s.whatsapp.net",
      "keyFromMe": "true",
      "messageType": "conversation",
      "status": "DELIVERY_ACK"
    },
    "cursor": {
      "type": "next",
      "id": 1200
    },
    "limit": 50
  }'
```

## Verificar contas

```json
{"numbers":["5511999999999","5511888888888@s.whatsapp.net"]}
```

Aceita de 1 a 100 telefones/JIDs individuais, não grupos. A resposta é um array com `jid`, `lid` opcional e `exists`.

## Marcar como lida

Modo por IDs internos:

```json
{"ids":[101,102]}
```

Modo por chaves do WhatsApp:

```json
{
  "sender":"5511999999999@s.whatsapp.net",
  "chat":"5511999999999@s.whatsapp.net",
  "messageIds":["3EB0...", "3EB1..."]
}
```

Use apenas um modo. A resposta é `{"message":"Read messages","read":"success"}`.

## Arquivar

```json
{
  "archive": true,
  "lastMessage": {
    "key": {"remoteJid":"5511999999999@s.whatsapp.net","fromMe":false,"id":"3EB0..."}
  }
}
```

Responde `204` sem body.

## Excluir mensagem

`DELETE /instance/codechat/chat/delete-message?id=101` recebe o ID interno positivo e responde `204`.

## Foto de perfil

Envie exatamente um entre `number`, `chat` e `recipient`. A resposta é `{"profilePictureUrl":"https://..."}` ou `{"profilePictureUrl":null}`.

## Rejeitar chamada

```json
{"callId":"ABCD","callFrom":"5511999999999@s.whatsapp.net"}
```

`callFrom` precisa ser JID válido. Responde `204`.

## Editar mensagem

```json
{"id":"3EB0...","text":"Texto corrigido"}
```

`id` aceita ID interno positivo ou ID WhatsApp não vazio. Só mensagens próprias do tipo conversation/extended text são editáveis. O sucesso retorna a mensagem persistida.

O download de mídia de uma mensagem está em [Mídia](./media.md). Aliases antigos `/chat/*` estão em [Endpoints legados](./legacy-endpoints.md).
