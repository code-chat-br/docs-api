# Mensagens

Este guia cobre os envios comuns. Pagamentos, pedidos, formulários e interativos estão em [Endpoints Pro](./pro-endpoints.md). Todas as rotas atuais exigem `Authorization: Bearer <token-da-instância>`.

## Matriz atual

| Método | Rota | Content-Type | Sucesso |
| --- | --- | --- | --- |
| `POST` | `/instance/:instance/send/text` | JSON | `200` ou `202` |
| `POST` | `/instance/:instance/send/link` | JSON | `200` ou `202` |
| `POST` | `/instance/:instance/send/media` | JSON | `200` ou `202` |
| `POST` | `/instance/:instance/send/media-file` | multipart | `200` ou `202` |
| `POST` | `/instance/:instance/send/ppt` | JSON | `200` ou `202` |
| `POST` | `/instance/:instance/send/ppt-file` | multipart | `200` ou `202` |
| `POST` | `/instance/:instance/send/contact` | JSON | `200` ou `202` |
| `POST` | `/instance/:instance/send/location` | JSON | `200` ou `202` |
| `POST` | `/instance/:instance/send/reaction` | JSON | `200` |

`ppt` significa áudio Push-to-Talk (PTT), não apresentação PowerPoint. `ptv`, aceito por envio de mídia, significa vídeo circular/video note e é outro formato.

## Destinatário e opções

Na maioria dos bodies JSON, envie exatamente um entre `number`, `chat` e `recipient`. O valor pode ser telefone ou JID compatível. Áudio PTT aceita somente `number`; reação identifica a conversa em `key.remoteJid`.

```json
{
  "number": "5511999999999",
  "options": {
    "delay": 1000,
    "presence": "composing",
    "quotedMessageId": "3EB0...",
    "externalAttributes": {"ticketId": "T-123"},
    "mentionAll": false
  }
}
```

| Opção | Regra |
| --- | --- |
| `delay` | Milissegundos; até `120000` em geral e `300000` para áudio PTT. |
| `presence` | `composing`, `recording` ou `paused`; combinações incompatíveis com o tipo são rejeitadas. |
| `quotedMessageId` | ID da mensagem citada. Não use junto de `quotedMessage`. |
| `quotedMessage` | Objeto de mensagem citado. Não use junto do ID. |
| `externalAttributes` | Objeto JSON persistido com a mensagem. |
| `mentionAll` | Envio assíncrono para todos os participantes quando suportado; responde `202`. |

`mentionAll` não é aceito por reação, pagamento, PIX, revisão, formulário ou mensagens interativas.

## Texto

```json
{
  "number": "5511999999999",
  "textMessage": {"text": "Olá!"},
  "options": {"presence": "composing"}
}
```

`textMessage.text` é obrigatório, não pode conter apenas espaços e aceita até 65536 caracteres.

## Link

```json
{
  "recipient": "5511999999999",
  "linkMessage": {
    "link": "https://codechat.dev",
    "title": "CodeChat",
    "description": "Documentação",
    "thumbnailUrl": "https://example.com/thumb.jpg"
  }
}
```

`link` é obrigatório e precisa ser HTTP(S). `thumbnailUrl`, quando presente, segue a mesma regra.

## Mídia por URL ou upload antecipado

```json
{
  "chat": "5511999999999@s.whatsapp.net",
  "mediaMessage": {
    "mediatype": "image",
    "media": "https://example.com/photo.jpg",
    "caption": "Foto"
  }
}
```

Alternativamente, use `mediaUploadId` criado por [upload antecipado](./media.md):

```json
{
  "number": "5511999999999",
  "mediaMessage": {
    "mediatype": "document",
    "mediaUploadId": 42,
    "fileName": "contrato.pdf"
  }
}
```

`mediatype` aceita `image`, `document`, `video`, `audio` ou `ptv`. Envie exatamente um entre `media` e `mediaUploadId`. O upload precisa pertencer à mesma instância e ter tipo compatível.

## Mídia multipart

```bash
curl -X POST "http://localhost:8084/instance/codechat/send/media-file" \
  -H "Authorization: Bearer $INSTANCE_TOKEN" \
  -F "number=5511999999999" \
  -F "mediaType=image" \
  -F "caption=Foto" \
  -F "attachment=@photo.jpg"
```

Campos adicionais: `delay`, `presence`, `quotedMessageId`, `quotedMessage` como JSON e `mentionAll`.

## Áudio Push-to-Talk

Por URL:

```json
{
  "number": "5511999999999",
  "audioMessage": {"audio": "https://example.com/audio.mp3"},
  "options": {"presence": "recording"}
}
```

Por arquivo, use `attachment` em multipart em `/send/ppt-file`. A API bloqueia URLs locais, privadas e link-local, limita o áudio a 50 MB e uma hora e converte a entrada para OGG/Opus com FFmpeg antes de enviar como PTT.

## Contato

```json
{
  "number": "5511999999999",
  "contactMessage": [
    {"fullName": "Maria Silva", "phoneNumber": "5511888888888", "organization": "Acme"}
  ]
}
```

O array precisa de ao menos um item. `fullName` é obrigatório; cada contato precisa de `vcard` ou de telefone/WUID suficiente para gerar um cartão.

## Localização

```json
{
  "number": "5511999999999",
  "locationMessage": {
    "latitude": -23.5505,
    "longitude": -46.6333,
    "name": "São Paulo",
    "address": "Centro"
  }
}
```

Latitude fica entre -90 e 90; longitude, entre -180 e 180.

## Reação

```json
{
  "reactionMessage": {
    "key": {
      "remoteJid": "5511999999999@s.whatsapp.net",
      "id": "3EB0...",
      "fromMe": false
    },
    "reaction": "👍"
  }
}
```

`reaction` pode ser string vazia para remover a reação. Em grupos, `participant` pode ser necessário.

## Respostas

Envio síncrono bem-sucedido retorna a mensagem persistida com `id`, campos `key*`, `pushName`, `messageType`, `content`, `messageTimestamp`, `device`, `isGroup`, `instanceId`, `metadata` e `externalAttributes` quando aplicáveis.

Operações assíncronas, como `mentionAll`, retornam `202` com `statusCode`, `status: "processing"`, `message`, `processId` e `instanceName`. Se o WhatsApp aceitar o envio mas a persistência local falhar, a API retorna `406`.

Os aliases antigos `/message/*` estão em [Endpoints legados](./legacy-endpoints.md).
