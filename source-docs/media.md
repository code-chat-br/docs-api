# Mídia

## Download de uma mensagem

```http
POST /instance/:instance/media/data?binary=false
Authorization: Bearer <token-da-instância>
Content-Type: application/json
```

Envie exatamente um dos modos:

```json
{"id":101}
```

```json
{"keyId":"3EB0..."}
```

```json
{
  "messageType":"imageMessage",
  "content":{"url":"...","directPath":"...","mediaKey":"..."},
  "keyId":"3EB0..."
}
```

`id` precisa ser inteiro positivo; `keyId` aceita até 256 caracteres. No modo manual, `messageType` aceita `imageMessage`, `videoMessage`, `documentMessage`, `stickerMessage` ou `audioMessage`, e `content` precisa ser objeto não vazio.

Com `binary=true`, a resposta é o arquivo bruto com `Content-Type` e `Content-Disposition`. Sem o parâmetro ou com `false`, a resposta é `multipart/form-data` com `mediaType`, `fileName`, `size` (objeto JSON de metadados), `mimetype` e a parte `file`. O download é limitado a 50 MB.

## Upload antecipado

O upload antecipado envia a mídia imediatamente ao WhatsApp e guarda apenas metadados e credenciais de mídia no PostgreSQL. O binário não fica salvo localmente. Os registros são vinculados à instância; a expiração padrão de dez dias é informativa.

| Método | Rota | Sucesso | Finalidade |
| --- | --- | --- | --- |
| `POST` | `/instance/:instance/media/uploads` | `201` | Faz upload. |
| `GET` | `/instance/:instance/media/uploads` | `200` | Lista com cursor. |
| `GET` | `/instance/:instance/media/:id/uploads` | `200` | Consulta um registro. |
| `DELETE` | `/instance/:instance/media/:id/uploads` | `204` | Exclui somente o registro local. |

### Criar

```bash
curl -X POST "http://localhost:8084/instance/codechat/media/uploads" \
  -H "Authorization: Bearer $INSTANCE_TOKEN" \
  -F "mediaType=image" \
  -F "externalId=asset-123" \
  -F 'externalAttributes={"tenantId":"acme"}' \
  -F "file=@photo.jpg"
```

`mediaType` aceita `image`, `video`, `audio` ou `document`. `externalId` aceita até 255 caracteres. `externalAttributes` precisa ser objeto JSON de até 16 KB. O limite padrão do arquivo é 100 MB e pode ser configurado.

A resposta inclui `id`, `instanceId`, `externalId`, `mediaType`, `mimeType`, `originalFileName`, `originalFileSize`, `originalFileSHA256`, `jpegThumbnail`, `externalAttributes`, `createdAt`, `updatedAt`, `expiresAt` e `expired`. O objeto `upload` agrupa `url`, `directPath`, `handle`, `objectId`, `mediaKey`, `fileEncSHA256`, `fileSHA256` e `fileLength` retornados pelo WhatsApp.

### Listar

Filtros: `externalId`, `mediaType`, `expired=true|false`, `createdFrom` e `createdTo` em RFC3339, `limit`, `nextCursor` e `previousCursor`. `limit` usa 20 por padrão e é limitado a 100. Os cursores precisam ser inteiros positivos e são mutuamente exclusivos.

Na primeira página, não envie cursor. Para avançar, envie o `nextCursor` recebido na página atual; para voltar, envie o `previousCursor`. Mantenha os mesmos filtros e o mesmo `limit` entre as páginas.

```http
GET /instance/codechat/media/uploads?limit=20&nextCursor=42
GET /instance/codechat/media/uploads?limit=20&previousCursor=63
```

O parâmetro `cursor` continua aceito como alias legado de `nextCursor`, mas não pode ser combinado com `nextCursor` nem `previousCursor`.

```json
{
  "nextCursor": "42",
  "previousCursor": "63",
  "totalRecords": 80,
  "records": [
    {
      "id": 1,
      "instanceId": 1,
      "mediaType": "image",
      "mimeType": "image/png",
      "originalFileName": "go-api.png",
      "originalFileSize": 106344,
      "originalFileSHA256": "string",
      "upload": {
          "url": "string",
          "directPath": "string",
          "mediaKey": "string",
          "fileEncSHA256": "uxHh/string",
          "fileSHA256": "string",
          "fileLength": 106344,
          "jpegThumbnail": "string"
      },
      "createdAt": "2026-07-12T19:08:45.043255Z",
      "updatedAt": "2026-07-12T19:08:45.043255Z",
      "expiresAt": "2026-07-22T19:08:45.043255Z",
      "expired": false
    }
  ]
}
```

O exemplo é reduzido; cada item de `records` contém todos os campos do upload descritos acima.

`nextCursor` é `null` na última página e `previousCursor` é `null` na primeira página.

Consulta e exclusão sempre restringem o registro à instância autenticada. A exclusão não remove o objeto já hospedado pelo WhatsApp.

Erros comuns: `400`, `404`, `413`, `415`, `500` e `503`. O alias legado do download é `POST /chat/mediaData/:instanceName`.
