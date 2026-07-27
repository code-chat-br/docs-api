# Fluxos de chamadas diretas

Este documento mostra os dois fluxos mais comuns de chamada 1:1:

1. a API origina a chamada para um destinatario;
2. um cliente externo liga para o numero conectado na API e a API atende.

O objetivo aqui e documentar o caminho que o dashboard precisa seguir: endpoints HTTP, eventos recebidos no WebSocket de eventos e o momento correto de abrir o WebSocket binario de midia para enviar buffers de audio para o backend.

## WebSockets usados no fluxo

Existem dois WebSockets diferentes:

- WebSocket de eventos:

```text
GET /ws/instance/events?event=<EVENTO>&token=<INSTANCE_JWT>
```

- WebSocket de midia da chamada:

```text
GET /ws/instance/{instanceName}/calls/{callId}/media?token=<INSTANCE_JWT>
```

Cada conexao de eventos assina exatamente um evento. Nao existe wildcard. Na pratica, para uma tela de chamadas diretas, o front normalmente abre conexoes para os eventos que deseja observar, por exemplo:

```text
/ws/instance/events?event=call.incoming&token=<INSTANCE_JWT>
/ws/instance/events?event=call.ringing&token=<INSTANCE_JWT>
/ws/instance/events?event=call.ready&token=<INSTANCE_JWT>
/ws/instance/events?event=call.ended&token=<INSTANCE_JWT>
/ws/instance/events?event=call.ended_unconfirmed&token=<INSTANCE_JWT>
```

Para iniciar o envio de audio local, use `call.ready` com `data.call.status === "ACTIVE"` como gatilho principal. A API tambem publica `call.active`, mas `call.ready` e o sinal explicito de que o provider confirmou a sessao de midia.

## Body dos eventos `call.*`

Os eventos recebidos no WebSocket de eventos seguem o envelope padrao de webhook. Para chamadas, o campo `data` contem o envelope especifico da chamada.

Exemplo de `call.ready`:

```json
{
  "event": "call.ready",
  "instance": {
    "id": 42,
    "name": "test_001",
    "connectionStatus": "online",
    "ownerJid": "5531888888888@s.whatsapp.net",
    "externalAttributes": {}
  },
  "data": {
    "event": "call.ready",
    "instance": "test_001",
    "instanceId": 42,
    "call": {
      "id": "01900000-0000-7000-8000-000000000001",
      "providerCallId": "00OUTBOUND123",
      "peer": "5531999999999",
      "direction": "outgoing",
      "status": "ACTIVE",
      "answeredBy": "api",
      "audio": true,
      "video": false
    },
    "data": {},
    "sequence": 4,
    "timestamp": "2026-07-23T20:00:04Z"
  },
  "timestamp": "2026-07-23T20:00:04Z"
}
```

No dashboard, os campos mais importantes ficam em:

- `event`: nome do evento assinado.
- `data.call.id`: UUID interno da chamada. Use este valor nos endpoints HTTP e no WebSocket de midia.
- `data.call.providerCallId`: ID do provider. Tambem pode ser usado em rotas que aceitam referencia de chamada.
- `data.call.direction`: `incoming` ou `outgoing`.
- `data.call.status`: estado atual da chamada.
- `data.call.peer`: numero/JID do outro lado.
- `data.sequence`: sequencia monotona por chamada.

`answeredBy: "api"` indica que a API assumiu a midia da chamada. No fluxo de saida, o sinal pratico de que o destinatario atendeu e o recebimento de `call.ready`/`ACTIVE`.

## Fluxo 1: API origina a chamada

Neste fluxo, o dashboard ou outro cliente HTTP chama a API para iniciar uma ligacao para um destinatario. Depois que o destinatario atende, o front abre o WebSocket binario de midia e comeca a enviar os buffers de audio para o backend.

### 1. Iniciar a chamada

Endpoint:

```http
POST /call/{instanceName}
Authorization: Bearer <INSTANCE_JWT>
Content-Type: application/json
Idempotency-Key: crm-call-123
```

Body:

```json
{
  "target": "5531999999999",
  "video": false,
  "externalId": "crm-call-123",
  "recording": {
    "enabled": false,
    "audio": false,
    "video": false
  }
}
```

Campos principais:

- `target`: obrigatorio. Numero de telefone ou JID direto do WhatsApp.
- `video`: `false` para chamada de audio; `true` para chamada de video, se habilitada.
- `externalId`: opcional. Tambem pode ser preenchido pelo header `Idempotency-Key`; evita duplicidade em retentativas.
- `recording`: opcional. Controla solicitacao de gravacao.

Retorno `201`:

```json
{
  "id": "01900000-0000-7000-8000-000000000001",
  "instanceId": 42,
  "instance": "test_001",
  "provider": "meowcaller",
  "providerCallId": "00OUTBOUND123",
  "direction": "outgoing",
  "status": "OUTGOING",
  "peer": "5531999999999",
  "audio": true,
  "video": false,
  "recordingEnabled": false,
  "recordingStatus": "NOT_REQUESTED",
  "externalId": "crm-call-123",
  "startedAt": "2026-07-23T20:00:00Z",
  "durationSeconds": 0,
  "version": 1,
  "stateVersion": 1,
  "createdAt": "2026-07-23T20:00:00Z",
  "updatedAt": "2026-07-23T20:00:00Z"
}
```

Neste momento a chamada foi criada e enviada ao provider, mas o dashboard ainda nao deve abrir o WebSocket de midia como se a conversa ja estivesse ativa.

### 2. Acompanhar toque no destinatario

Quando o provider informar que a chamada de saida esta tocando no aparelho do destinatario, a API publica:

```text
call.ringing
```

Exemplo de body no WebSocket:

```json
{
  "event": "call.ringing",
  "instance": {
    "id": 42,
    "name": "test_001",
    "connectionStatus": "online",
    "ownerJid": "5531888888888@s.whatsapp.net",
    "externalAttributes": {}
  },
  "data": {
    "event": "call.ringing",
    "instance": "test_001",
    "instanceId": 42,
    "call": {
      "id": "01900000-0000-7000-8000-000000000001",
      "providerCallId": "00OUTBOUND123",
      "peer": "5531999999999",
      "direction": "outgoing",
      "status": "RINGING",
      "audio": true,
      "video": false
    },
    "data": {
      "reason": "",
      "errorCode": ""
    },
    "sequence": 2,
    "timestamp": "2026-07-23T20:00:01Z"
  },
  "timestamp": "2026-07-23T20:00:01Z"
}
```

Use este evento apenas para atualizar a UI para "chamando". Ele ainda nao e o ponto de inicio do envio de audio.

### 3. Destinatario atende

Quando o destinatario atende e o provider confirma que a midia esta pronta, a API publica `call.active` e, em seguida, `call.ready`.

O dashboard deve usar:

```text
call.ready
```

com:

```text
data.call.status === "ACTIVE"
```

Este e o ponto em que o front sabe que pode abrir o WebSocket de midia e iniciar o envio dos buffers.

### 4. Abrir WebSocket de midia e enviar audio

Endpoint:

```text
GET /ws/instance/{instanceName}/calls/{callId}/media?token=<INSTANCE_JWT>&audioSend=true&audioReceive=true
```

Exemplo:

```text
ws://localhost:8084/ws/instance/test_001/calls/01900000-0000-7000-8000-000000000001/media?token=<INSTANCE_JWT>&audioSend=true&audioReceive=true
```

O `callId` pode ser o UUID interno (`data.call.id`) ou o `providerCallId`, mas o UUID interno e a opcao recomendada no dashboard.

O WebSocket de midia usa frames binarios. Para chamada direta, o protocolo padrao e `WMC1`.

Header do frame:

| Offset | Tamanho | Descricao |
| ---: | ---: | --- |
| `0` | `4` | Magic `WMC1`. |
| `4` | `1` | Versao `1`. |
| `5` | `1` | Tipo: `1` audio PCM float32, `2` video H.264 Annex-B. |
| `6` | `2` | Reservado. |
| `8` | `4` | Duracao em ms, big-endian. |
| `12` | `4` | Tamanho do payload, big-endian. |
| `16` | `N` | Payload. |

Para audio do dashboard para a API:

- tipo: `1`;
- payload: PCM `float32 little-endian`;
- canal: mono;
- sample rate: 16 kHz;
- frame recomendado: cerca de 60 ms.

Exemplo de empacotamento:

```js
function mediaFrame(kind, payload, durationMs = 0) {
  const header = new ArrayBuffer(16);
  const view = new DataView(header);

  view.setUint8(0, 0x57); // W
  view.setUint8(1, 0x4d); // M
  view.setUint8(2, 0x43); // C
  view.setUint8(3, 0x31); // 1
  view.setUint8(4, 1);    // version
  view.setUint8(5, kind); // 1 = audio
  view.setUint32(8, durationMs, false);
  view.setUint32(12, payload.byteLength, false);

  const out = new Uint8Array(16 + payload.byteLength);
  out.set(new Uint8Array(header), 0);
  out.set(new Uint8Array(payload), 16);
  return out;
}

const ws = new WebSocket(
  `ws://localhost:8084/ws/instance/test_001/calls/${callId}/media?token=${token}&audioSend=true&audioReceive=true`
);

ws.binaryType = "arraybuffer";

// float32PcmBuffer = ArrayBuffer com PCM float32 little-endian mono/16 kHz.
ws.send(mediaFrame(1, float32PcmBuffer));
```

O servidor tambem pode enviar frames de audio remoto no mesmo WebSocket, usando o mesmo envelope binario e `kind = 1`.

### 5. Encerrar a chamada de saida

Se a API/dashboard encerrar:

```http
POST /call/{instanceName}/{callId}/hangup
Authorization: Bearer <INSTANCE_JWT>
Content-Type: application/json
```

Body:

```json
{
  "reason": "dashboard_hangup"
}
```

Retorno `200`:

```json
{
  "call": {
    "id": "01900000-0000-7000-8000-000000000001",
    "instanceId": 42,
    "instance": "test_001",
    "provider": "meowcaller",
    "providerCallId": "00OUTBOUND123",
    "direction": "outgoing",
    "status": "ENDING",
    "peer": "5531999999999",
    "audio": true,
    "video": false,
    "answeredBy": "api",
    "endedBy": "api",
    "endReason": "dashboard_hangup"
  },
  "termination": {
    "requestedAt": "2026-07-23T20:01:00Z",
    "sentAt": "2026-07-23T20:01:00Z",
    "sent": true,
    "confirmed": false,
    "signalAcknowledged": false,
    "remoteTerminationObserved": false,
    "confirmationTimedOut": false,
    "attempts": 1,
    "stanzaId": "ABCDEF123",
    "to": "5531999999999@s.whatsapp.net",
    "callCreator": "5531888888888@s.whatsapp.net"
  }
}
```

Depois do `hangup`, nao feche a UI apenas por receber `call.ending`. Aguarde um evento terminal:

- `call.ended`: encerramento confirmado.
- `call.ended_unconfirmed`: terminate enviado, mas sem confirmacao remota dentro do timeout.

Se o destinatario encerrar a chamada, a API publica um evento terminal, normalmente `call.ended`, com `data.call.endedBy` indicando o outro lado/provedor conforme o motivo recebido.

Exemplo:

```json
{
  "event": "call.ended",
  "instance": {
    "id": 42,
    "name": "test_001",
    "connectionStatus": "online",
    "ownerJid": "5531888888888@s.whatsapp.net",
    "externalAttributes": {}
  },
  "data": {
    "event": "call.ended",
    "instance": "test_001",
    "instanceId": 42,
    "call": {
      "id": "01900000-0000-7000-8000-000000000001",
      "providerCallId": "00OUTBOUND123",
      "peer": "5531999999999",
      "direction": "outgoing",
      "status": "ENDED",
      "answeredBy": "api",
      "endedBy": "peer",
      "endReason": "terminate",
      "audio": true,
      "video": false
    },
    "data": {
      "reason": "terminate",
      "errorCode": ""
    },
    "sequence": 7,
    "timestamp": "2026-07-23T20:01:05Z"
  },
  "timestamp": "2026-07-23T20:01:05Z"
}
```

## Fluxo 2: cliente externo liga para o numero conectado na API

Neste fluxo, o cliente externo nao esta conectado a API. Ele liga pelo WhatsApp para o numero que esta conectado em uma instancia da API. A API recebe a chamada, publica o evento de toque, o dashboard atende via endpoint HTTP e so depois de `call.ready` abre o WebSocket de midia.

### 1. Receber evento de chamada tocando

O dashboard deve estar assinando:

```text
GET /ws/instance/events?event=call.incoming&token=<INSTANCE_JWT>
```

Quando alguem liga para o numero conectado na API, o evento recebido e:

```text
call.incoming
```

Exemplo de body:

```json
{
  "event": "call.incoming",
  "instance": {
    "id": 42,
    "name": "test_001",
    "connectionStatus": "online",
    "ownerJid": "5531888888888@s.whatsapp.net",
    "externalAttributes": {}
  },
  "data": {
    "event": "call.incoming",
    "instance": "test_001",
    "instanceId": 42,
    "call": {
      "id": "01900000-0000-7000-8000-000000000010",
      "providerCallId": "00INBOUND123",
      "peer": "5531999999999",
      "direction": "incoming",
      "status": "RINGING",
      "audio": true,
      "video": false
    },
    "data": {},
    "sequence": 1,
    "timestamp": "2026-07-23T21:00:00Z"
  },
  "timestamp": "2026-07-23T21:00:00Z"
}
```

Use `data.call.id` para atender pela API.

### 2. Atender pela API

Endpoint:

```http
POST /call/{instanceName}/{callId}/answer
Authorization: Bearer <INSTANCE_JWT>
```

Exemplo:

```bash
curl -X POST "$API/call/test_001/01900000-0000-7000-8000-000000000010/answer" \
  -H "Authorization: Bearer $TOKEN"
```

Retorno `200`:

```json
{
  "id": "01900000-0000-7000-8000-000000000010",
  "instanceId": 42,
  "instance": "test_001",
  "provider": "meowcaller",
  "providerCallId": "00INBOUND123",
  "direction": "incoming",
  "status": "CONNECTING",
  "peer": "5531999999999",
  "audio": true,
  "video": false,
  "answeredBy": "api",
  "answerRequestedBy": "api",
  "startedAt": "2026-07-23T21:00:00Z",
  "answeredAt": "2026-07-23T21:00:03Z",
  "durationSeconds": 0,
  "version": 3,
  "stateVersion": 3,
  "createdAt": "2026-07-23T21:00:00Z",
  "updatedAt": "2026-07-23T21:00:03Z"
}
```

Apos esse endpoint, a API publica eventos intermediarios como:

- `call.answer.requested`;
- `call.connecting`;
- `call.active`;
- `call.ready`.

O front deve iniciar o WebSocket de midia apenas no `call.ready` com `data.call.status === "ACTIVE"`.

### 3. Chamada atendida e midia pronta

Exemplo de `call.ready` para chamada recebida:

```json
{
  "event": "call.ready",
  "instance": {
    "id": 42,
    "name": "test_001",
    "connectionStatus": "online",
    "ownerJid": "5531888888888@s.whatsapp.net",
    "externalAttributes": {}
  },
  "data": {
    "event": "call.ready",
    "instance": "test_001",
    "instanceId": 42,
    "call": {
      "id": "01900000-0000-7000-8000-000000000010",
      "providerCallId": "00INBOUND123",
      "peer": "5531999999999",
      "direction": "incoming",
      "status": "ACTIVE",
      "answeredBy": "api",
      "audio": true,
      "video": false
    },
    "data": {},
    "sequence": 4,
    "timestamp": "2026-07-23T21:00:04Z"
  },
  "timestamp": "2026-07-23T21:00:04Z"
}
```

Depois desse evento, abra:

```text
GET /ws/instance/test_001/calls/01900000-0000-7000-8000-000000000010/media?token=<INSTANCE_JWT>&audioSend=true&audioReceive=true
```

A partir dai, o dashboard envia os envelopes binarios `WMC1` com os buffers PCM float32 para o backend, como descrito no fluxo de saida.

### 4. Encerrar a chamada recebida

Se o dashboard/API encerrar, use o mesmo endpoint:

```http
POST /call/{instanceName}/{callId}/hangup
Authorization: Bearer <INSTANCE_JWT>
Content-Type: application/json
```

Body:

```json
{
  "reason": "dashboard_hangup"
}
```

O dashboard deve aguardar:

- `call.ended`, quando o encerramento for confirmado;
- `call.ended_unconfirmed`, quando a API enviou o terminate, mas nao recebeu confirmacao ate o timeout.

Se o cliente externo encerrar, o dashboard recebe `call.ended` sem precisar chamar `/hangup`.

Exemplo de evento quando o cliente externo encerra:

```json
{
  "event": "call.ended",
  "instance": {
    "id": 42,
    "name": "test_001",
    "connectionStatus": "online",
    "ownerJid": "5531888888888@s.whatsapp.net",
    "externalAttributes": {}
  },
  "data": {
    "event": "call.ended",
    "instance": "test_001",
    "instanceId": 42,
    "call": {
      "id": "01900000-0000-7000-8000-000000000010",
      "providerCallId": "00INBOUND123",
      "peer": "5531999999999",
      "direction": "incoming",
      "status": "ENDED",
      "answeredBy": "api",
      "endedBy": "peer",
      "endReason": "terminate",
      "audio": true,
      "video": false
    },
    "data": {
      "reason": "terminate",
      "errorCode": ""
    },
    "sequence": 6,
    "timestamp": "2026-07-23T21:05:00Z"
  },
  "timestamp": "2026-07-23T21:05:00Z"
}
```

## Resumo de eventos por fluxo

| Momento | Fluxo API -> destinatario | Fluxo cliente externo -> API |
| --- | --- | --- |
| Chamada criada | `call.outgoing` | - |
| Tocando | `call.ringing` | `call.incoming` com `status=RINGING` |
| Atendimento solicitado pela API | - | `call.answer.requested` |
| Conectando | `call.connecting`, se emitido pelo provider | `call.connecting` |
| Midia pronta | `call.ready` com `status=ACTIVE` | `call.ready` com `status=ACTIVE` |
| API desligando | `call.hangup.requested`, `call.ending`, `call.terminate.sent` | `call.hangup.requested`, `call.ending`, `call.terminate.sent` |
| Encerrado confirmado | `call.ended` | `call.ended` |
| Encerrado sem confirmacao | `call.ended_unconfirmed` | `call.ended_unconfirmed` |

## Reconciliacao apos reconnect

Se o dashboard reconectar ou perder algum evento, consulte:

```http
GET /call/{instanceName}/{callId}
Authorization: Bearer <INSTANCE_JWT>
```

Inicie ou retome a midia apenas se o retorno estiver com:

```text
status === "ACTIVE"
```

Para auditoria da sequencia recebida:

```http
GET /call/{instanceName}/{callId}/events
Authorization: Bearer <INSTANCE_JWT>
```
