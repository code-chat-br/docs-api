# Chamadas WhatsApp

Este documento consolida a documentação do subsistema experimental de chamadas WhatsApp da API.

## Sumário

- [Visão Geral](#visão-geral)
- [Arquitetura](#arquitetura)
- [Dependências](#dependências)
- [Configuração](#configuração)
- [Configuração Por Instância](#configuração-por-instância)
- [Ciclo de Vida](#ciclo-de-vida)
- [Comportamento Multi-Device](#comportamento-multi-device)
- [API](#api)
- [Eventos](#eventos)
- [WebSocket](#websocket)
- [Mídia](#mídia)
- [Vídeo](#vídeo)
- [Gravação](#gravação)
- [Armazenamento de Gravações](#armazenamento-de-gravações)
- [Retenção de Gravações](#retenção-de-gravações)
- [Recuperação de Gravações](#recuperação-de-gravações)
- [Segurança](#segurança)
- [Validação Manual](#validação-manual)
- [Solução de Problemas](#solução-de-problemas)

## Visão Geral

O suporte a chamadas 1:1 do WhatsApp é experimental, não oficial e só fica disponível quando `CALLS_ENABLED=true` e a instância também habilita chamadas na configuração própria.

A implementação usa instâncias já existentes, autenticação JWT da instância, migrations PostgreSQL, webhooks, publicação de eventos WebSocket, logs e shutdown controlado. O runtime de chamada usa `github.com/purpshell/meowcaller` sobre o `whatsmeow.Client` existente. O wrapper é registrado antes de `Connect()` apenas para instâncias que já possuem chamadas habilitadas. Instâncias passivas não criam wrapper de chamadas.

Fluxo de chamada originada pela API:

1. `POST /call/:instanceName` valida instância conectada, limites de concorrência, destino, flags e idempotência.
2. A API persiste a chamada.
3. O provider inicia a chamada.
4. A API publica `call.outgoing`.

Fluxo de chamada recebida pela API:

1. O provider registra um callback de chamada recebida por instância habilitada.
2. Chamadas recebidas são persistidas, registradas em memória e publicadas como `call.incoming`.
3. A chamada entra em `RINGING`.

Esse fluxo de entrada só se aplica depois que chamadas foram habilitadas para a instância. Uma instância recém-conectada sem configuração de chamadas, ou com `callsEnabled=false`, fica passiva: a API não registra provider de chamadas, não persiste histórico, não publica eventos e não rejeita nem atende a chamada WhatsApp. O smartphone vinculado continua responsável por tocar, atender, rejeitar e transportar mídia.

## Arquitetura

As responsabilidades são separadas assim:

- `meowcaller`: protocolo de chamada, sinalização e mídia.
- Observer bruto do `whatsmeow`: auditoria e reconciliação de estado.
- `CallManager`: índices de runtime, cancelamento e concorrência.
- `CallService`: regras de negócio.
- `CallRepository`: persistência.
- `EventPublisher`/gerenciador de webhook: entrega em WebSocket e webhook.

Handlers HTTP não chamam `meowcaller` diretamente. Eles chamam o serviço de aplicação, que usa a interface interna de provider.

O observer bruto é estritamente observacional. Ele não envia nodes, não executa `Answer`, `Reject` ou `Hangup`, não altera handshake, não acessa `DangerousInternals` e não duplica comportamento de protocolo do `meowcaller`.

## Dependências

Dependência de chamada fixada:

- `github.com/purpshell/meowcaller v0.0.0-20260722160050-8e4008f12884`
- commit: `8e4008f12884cf15dc487f1d4afc83055275f966`
- `go.mod` upstream do `meowcaller`: Go `1.25.0`, `go.mau.fi/whatsmeow v0.0.0-20260609091626-4e622162b959`
- este projeto: Go `1.26`, `go.mau.fi/whatsmeow v0.0.0-20260630180629-b572e5bcb92b`

O projeto mantém a pseudo-versão mais nova do `whatsmeow` porque o adapter compila e evita downgrade da superfície já usada pela API.

## Configuração

Valores globais padrão:

```env
CALLS_ENABLED=false
CALLS_AUDIO_ENABLED=true
CALLS_VIDEO_ENABLED=false
CALLS_REACTIONS_ENABLED=true
CALLS_RECORDING_ENABLED=false
CALLS_RECORDING_DIRECTORY=./data/calls
CALLS_RECORDING_DEFAULT_RETENTION_DAYS=30
CALLS_RECORDING_MAX_RETENTION_DAYS=365
CALLS_RECORDING_MAX_DISK_MB=51200
CALLS_RECORDING_MIN_FREE_DISK_MB=2048
CALLS_RECORDING_MAX_FILE_MB=2048
CALLS_RECORDING_WORKER_BUFFER_FRAMES=256
CALLS_RECORDING_CLOSE_TIMEOUT_SECONDS=15
CALLS_RECORDING_PROCESSING_TIMEOUT_SECONDS=300
CALLS_RECORDING_GENERATE_SHA256=true
CALLS_RECORDING_GENERATE_FINAL_FILES=true
CALLS_RECORDING_KEEP_RAW_FILES=true
CALLS_RECORDING_FFMPEG_ENABLED=true
CALLS_RECORDING_FFMPEG_PATH=ffmpeg
CALLS_RECORDING_FFPROBE_PATH=ffprobe
CALLS_RECORDING_FFMPEG_MAX_CONCURRENT=2
CALLS_DIAGNOSTICS_ENABLED=false
CALLS_MAX_CONCURRENT_GLOBAL=20
CALLS_MAX_CONCURRENT_PER_INSTANCE=1
CALLS_MAX_DURATION_SECONDS=3600
CALLS_RECORDING_RETENTION_DAYS=7
CALLS_MEDIA_MAX_SIZE_MB=100
CALLS_MEDIA_DOWNLOAD_TIMEOUT_SECONDS=60
CALLS_DIAGNOSTICS_DIRECTORY=./data/call-diagnostics
CALLS_ALLOW_PRIVATE_MEDIA_DOWNLOADS=false
```

Valores inválidos impedem o startup da aplicação.

As flags globais são travas de segurança. Um recurso só fica efetivo quando a flag global e a configuração da instância estão habilitadas. Nenhuma instância herda chamadas automaticamente só porque `CALLS_ENABLED=true`.

`callsEnabled=false` é modo passivo, não modo de rejeição automática. Nesse estado a API não cria runtime `meowcaller`, não escreve linhas em `"Call"`/`"CallEvent"`, não emite webhooks/WebSocket e não envia `Answer`, `Reject` ou `Hangup`. Para deixar chamadas funcionando normalmente no telefone físico, mantenha a instância sem configuração de chamadas ou com `callsEnabled=false`.

## Configuração Por Instância

As URLs públicas usam `instanceName`:

```http
GET /call/{instanceName}/config
PUT /call/{instanceName}/config
```

Internamente, o serviço resolve `instanceName` pelo repositório de instâncias e usa `Instance.id` como chave de persistência, cache, chamadas e eventos. Renomear a instância não exige atualizar `"InstanceCallSettings"`, `"Call"`, `"CallEvent"` ou `"CallRecording"`.

Regras efetivas:

```text
calls = CALLS_ENABLED && instance.callsEnabled
audio = calls && CALLS_AUDIO_ENABLED && instance.audio.enabled
video = calls && CALLS_VIDEO_ENABLED && instance.video.enabled
recording = calls && CALLS_RECORDING_ENABLED && instance.recording.enabled
reactions = calls && CALLS_REACTIONS_ENABLED && instance.reactionsEnabled
diagnostics = calls && CALLS_DIAGNOSTICS_ENABLED && instance.diagnosticsEnabled
```

Configuração básica para atender pela API, desligar pela API e gravar áudio/vídeo quando houver mídia na API:

```json
{
  "callsEnabled": true,
  "incomingCallsEnabled": true,
  "outgoingCallsEnabled": true,
  "audio": {
    "enabled": true,
    "receiveEnabled": true,
    "sendEnabled": true,
    "playbackEnabled": true,
    "streamingEnabled": true
  },
  "video": {
    "enabled": true,
    "receiveEnabled": true,
    "sendEnabled": true,
    "upgradeEnabled": true,
    "playbackEnabled": true
  },
  "reactionsEnabled": true,
  "recording": {
    "enabled": true,
    "audioEnabled": true,
    "videoEnabled": true,
    "autoRecordEnabled": true,
    "incomingAudioRecordingEnabled": true,
    "outgoingAudioRecordingEnabled": true,
    "mixedAudioEnabled": true,
    "stereoAudioEnabled": false,
    "incomingVideoRecordingEnabled": true,
    "outgoingVideoRecordingEnabled": true,
    "generateFinalAudioEnabled": true,
    "generateFinalVideoEnabled": false,
    "keepRawRecordingFiles": true,
    "retentionDays": 7,
    "maxDiskMb": null,
    "consentRequired": false,
    "noticeText": null
  },
  "diagnosticsEnabled": false,
  "autoAnswer": {
    "enabled": false,
    "delayMs": 0,
    "audioMediaId": null,
    "videoMediaId": null
  },
  "limits": {
    "maxConcurrentCalls": 1,
    "ringTimeoutSeconds": 60,
    "connectTimeoutSeconds": 45,
    "maxCallDurationSeconds": 3600
  }
}
```

Erros de validação retornam `422 invalid_call_settings` com mapa `fields`.

Regras de validação:

- `autoAnswer.enabled=true` exige `incomingCallsEnabled=true`.
- `autoAnswer.audioMediaId` exige `audio.playbackEnabled=true`.
- `autoAnswer.videoMediaId` exige `video.enabled=true` e `video.playbackEnabled=true`.
- `maxConcurrentCalls` precisa estar entre `1` e `CALLS_MAX_CONCURRENT_PER_INSTANCE`.
- `ringTimeoutSeconds` precisa estar entre `5` e `300`.
- `connectTimeoutSeconds` precisa estar entre `5` e `120`.
- `maxCallDurationSeconds` precisa estar entre `30` e `CALLS_MAX_DURATION_SECONDS`.
- `autoAnswer.delayMs` precisa estar entre `0` e `ringTimeoutSeconds * 1000`.
- `recording.retentionDays` precisa estar entre `1` e `CALLS_RECORDING_MAX_RETENTION_DAYS`.
- `recording.enabled=true` exige `CALLS_RECORDING_ENABLED=true`.

Subconfigurações podem ser salvas enquanto `callsEnabled=false`; elas apenas ficam sem efeito.

Quando `autoAnswer.enabled=true`, o callback de entrada publica a chamada recebida, aguarda `delayMs`, recarrega as configurações efetivas e atende apenas se a chamada ainda estiver `RINGING`. Se outro dispositivo atender primeiro, a transição terminal vence e o autoatendimento é cancelado.

## Ciclo de Vida

Estados estáveis:

- `INCOMING`
- `OUTGOING`
- `RINGING`
- `PREACCEPTED`
- `CONNECTING`
- `ACTIVE`
- `ENDING`
- `ENDED`
- `REJECTED`
- `MISSED`
- `BUSY`
- `FAILED`
- `INTERRUPTED`
- `ANSWERED_ELSEWHERE`
- `REJECTED_ELSEWHERE`

Estados terminais:

- `ENDED`
- `REJECTED`
- `MISSED`
- `BUSY`
- `FAILED`
- `INTERRUPTED`
- `ANSWERED_ELSEWHERE`
- `REJECTED_ELSEWHERE`

Estados terminais nunca voltam para estados ativos. Transições inválidas retornam `409 invalid_call_transition`.

Quando um estado terminal é aplicado, o cleanup é idempotente: timeouts são cancelados, estado do provider é limpo, gravações ativas são finalizadas e índices em memória são removidos.

## Comportamento Multi-Device

Existem dois caminhos válidos de atendimento.

Atendimento pela API:

1. `OnIncomingCall` cria ou reconcilia a chamada.
2. `/answer` grava `answer_requested_by=api`.
3. `call.Answer()` é executado pelo `meowcaller`.
4. `OnReady` move a chamada para `ACTIVE` e grava `answered_by=api`.
5. A mídia fica disponível no processo da API e pode ser gravada.

Atendimento pelo smartphone ou outro dispositivo vinculado:

1. O observer bruto do `whatsmeow` vê `CallTerminate`, uma oferta já encerrada ou motivo equivalente, como `accepted_elsewhere`.
2. A chamada é reconciliada por `"instanceId" + "provider" + "providerCallId"`.
3. O status vira `ANSWERED_ELSEWHERE`.
4. O runtime local é limpo e nenhum writer de mídia local é criado.
5. `/answer`, `/reject`, `/hangup` e `/recording/start` retornam `409`.

`accepted_elsewhere` significa que o WhatsApp confirmou que outro dispositivo vinculado aceitou a chamada. A API não deve tratar isso como `call.active`, não deve emitir `call.answered` e não deve esperar áudio/vídeo dentro do processo da API.

Se o smartphone atender antes de `meowcaller.OnIncomingCall` disparar, o observer bruto ainda pode criar histórico com provider call ID, peer/JID quando disponível, direção, motivo e timestamp. Se o peer não estiver disponível no evento bruto, a API persiste apenas metadados sanitizados e não inventa telefone.

Limitações:

- O comportamento multi-device real depende dos campos brutos expostos pela versão fixada do `whatsmeow`.
- O observer é apenas auditoria; ele nunca envia nodes do WhatsApp e nunca altera o handshake do `meowcaller`.
- Gravação fica indisponível quando outro dispositivo vinculado possui a mídia.

## API

Todos os endpoints exigem o token da instância:

```http
Authorization: Bearer <token-da-instancia>
```

Nos exemplos abaixo:

```bash
API="http://127.0.0.1:8084"
INSTANCE="test_001"
TOKEN="token-da-instancia"
CALL_ID="01900000-0000-7000-8000-000000000000"
PROVIDER_CALL_ID="00CD1D448E1522C15C544689DCE0C6F0"
RECORDING_ID="01900000-0000-7000-8000-000000000010"
```

`callId` aceita o UUID interno da chamada ou o provider call ID persistido. Use UUID interno quando possível; use provider call ID quando estiver copiando o ID diretamente dos eventos do WhatsApp/meowcaller.

### Formato Básico de Chamada

Exemplo de objeto `Call`:

```json
{
  "id": "01900000-0000-7000-8000-000000000000",
  "instanceId": 42,
  "instance": "test_001",
  "provider": "meowcaller",
  "providerCallId": "00CD1D448E1522C15C544689DCE0C6F0",
  "direction": "incoming",
  "status": "ACTIVE",
  "peer": "5531999999999",
  "peerJid": "5531999999999@s.whatsapp.net",
  "audio": true,
  "video": false,
  "localVideoActive": false,
  "remoteVideoActive": false,
  "recordingEnabled": true,
  "recordingRequested": true,
  "recordingStarted": true,
  "recordingCompleted": false,
  "recordingAvailable": false,
  "recordingStatus": "RECORDING",
  "answeredBy": "api",
  "answerRequestedBy": "api",
  "startedAt": "2026-07-23T20:00:00Z",
  "answeredAt": "2026-07-23T20:00:03Z",
  "connectedAt": "2026-07-23T20:00:04Z",
  "durationSeconds": 0,
  "version": 4,
  "stateVersion": 4,
  "createdAt": "2026-07-23T20:00:00Z",
  "updatedAt": "2026-07-23T20:00:04Z"
}
```

### `POST /call/{instanceName}`

Inicia uma chamada de saída pela API.

Use quando a API deve originar a chamada a partir da instância conectada. O endpoint valida se chamadas de saída estão habilitadas, se a instância está conectada, se o limite de concorrência permite nova chamada e se o alvo é válido. O header `Idempotency-Key` pode ser usado para evitar duplicidade quando o cliente repetir a requisição.

Quando `target` é um número de telefone, a API normaliza o número, consulta o WhatsApp com `IsOnWhatsApp` e chama o provider usando o JID canônico retornado, normalmente um `@lid`. Quando `target` já é um JID direto, como `148434170450082@lid`, a API não faz lookup e repassa o JID diretamente ao provider.

Exemplo:

```bash
curl -X POST "$API/call/$INSTANCE" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: crm-call-123" \
  -d '{
    "target": "5531999999999",
    "video": false,
    "externalId": "crm-call-123",
    "recording": {
      "enabled": true,
      "audio": true,
      "video": false
    }
  }'
```

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
  "recordingEnabled": true,
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

### `GET /call/{instanceName}`

Lista chamadas persistidas da instância.

Use para histórico, telas de monitoramento e paginação. Aceita filtros por `status`, `direction`, `peer`, `video`, `externalId`, `startedAtFrom`, `startedAtTo`, `createdAtFrom`, `createdAtTo`, `cursor` e `limit`.

Exemplo:

```bash
curl "$API/call/$INSTANCE?status=ACTIVE&limit=20" \
  -H "Authorization: Bearer $TOKEN"
```

Retorno `200`:

```json
{
  "data": [
    {
      "id": "01900000-0000-7000-8000-000000000000",
      "instanceId": 42,
      "instance": "test_001",
      "provider": "meowcaller",
      "providerCallId": "00CD1D448E1522C15C544689DCE0C6F0",
      "direction": "incoming",
      "status": "ACTIVE",
      "peer": "5531999999999",
      "audio": true,
      "video": false,
      "recordingStatus": "RECORDING",
      "startedAt": "2026-07-23T20:00:00Z",
      "durationSeconds": 0,
      "version": 4,
      "stateVersion": 4,
      "createdAt": "2026-07-23T20:00:00Z",
      "updatedAt": "2026-07-23T20:00:04Z"
    }
  ]
}
```

### `GET /call/{instanceName}/config`

Retorna a configuração armazenada e a configuração efetiva da instância.

Use antes de habilitar chamadas ou para diagnosticar por que um recurso não está disponível. `settings` mostra o que está salvo para a instância. `effective` mostra o resultado após aplicar as travas globais do ambiente.

Exemplo:

```bash
curl "$API/call/$INSTANCE/config" \
  -H "Authorization: Bearer $TOKEN"
```

Retorno `200`:

```json
{
  "instance": {
      "id": 1,
      "name": "test_001"
  },
  "settings": {
    "callsEnabled": true,
    "incomingCallsEnabled": true,
    "outgoingCallsEnabled": true,
    "audio": {
      "enabled": true,
      "receiveEnabled": true,
      "sendEnabled": true,
      "playbackEnabled": true,
      "streamingEnabled": true
    },
    "video": {
      "enabled": true,
      "receiveEnabled": true,
      "sendEnabled": true,
      "upgradeEnabled": true,
      "playbackEnabled": true
    },
    "reactionsEnabled": true,
    "recording": {
      "enabled": true,
      "audioEnabled": true,
      "videoEnabled": true,
      "autoRecordEnabled": true,
      "incomingAudioRecordingEnabled": true,
      "outgoingAudioRecordingEnabled": true,
      "mixedAudioEnabled": true,
      "stereoAudioEnabled": false,
      "incomingVideoRecordingEnabled": true,
      "outgoingVideoRecordingEnabled": true,
      "generateFinalAudioEnabled": true,
      "generateFinalVideoEnabled": false,
      "keepRawRecordingFiles": true,
      "retentionDays": 7,
      "maxDiskMb": null,
      "consentRequired": false,
      "noticeText": null
    },
    "diagnosticsEnabled": false,
    "autoAnswer": {
      "enabled": false,
      "delayMs": 0,
      "audioMediaId": null,
      "videoMediaId": null
    },
    "limits": {
      "maxConcurrentCalls": 1,
      "ringTimeoutSeconds": 60,
      "connectTimeoutSeconds": 45,
      "maxCallDurationSeconds": 3600
    }
  },
  "effective": {
    "callsEnabled": true,
    "incomingCallsEnabled": true,
    "outgoingCallsEnabled": true,
    "audioEnabled": true,
    "audioReceiveEnabled": true,
    "audioSendEnabled": true,
    "audioPlaybackEnabled": true,
    "audioStreamingEnabled": true,
    "videoEnabled": true,
    "videoReceiveEnabled": true,
    "videoSendEnabled": true,
    "videoUpgradeEnabled": true,
    "videoPlaybackEnabled": true,
    "reactionsEnabled": true,
    "recordingEnabled": true,
    "audioRecordingEnabled": true,
    "videoRecordingEnabled": true,
    "autoRecordEnabled": true,
    "incomingAudioRecordingEnabled": true,
    "outgoingAudioRecordingEnabled": true,
    "mixedAudioEnabled": true,
    "stereoAudioEnabled": false,
    "incomingVideoRecordingEnabled": true,
    "outgoingVideoRecordingEnabled": true,
    "generateFinalAudioEnabled": true,
    "generateFinalVideoEnabled": false,
    "keepRawRecordingFiles": true,
    "recordingRetentionDays": 7,
    "recordingConsentRequired": false,
    "diagnosticsEnabled": false,
    "autoAnswerEnabled": false,
    "maxConcurrentCalls": 1,
    "ringTimeoutSeconds": 60,
    "connectTimeoutSeconds": 45,
    "maxCallDurationSeconds": 3600
  }
}
```

### `PUT /call/{instanceName}/config`

Substitui a configuração de chamadas da instância.

Use para habilitar ou desabilitar chamadas da API por instância, definir limites, habilitar áudio/vídeo, gravação, autoatendimento e diagnósticos. Essa rota não deve ser confundida com conectar o WhatsApp: ela apenas configura o subsistema de chamadas.

Exemplo:

```bash
curl -X PUT "$API/call/$INSTANCE/config" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "callsEnabled": true,
    "incomingCallsEnabled": true,
    "outgoingCallsEnabled": true,
    "audio": {
      "enabled": true,
      "receiveEnabled": true,
      "sendEnabled": true,
      "playbackEnabled": true,
      "streamingEnabled": true
    },
    "video": {
      "enabled": true,
      "receiveEnabled": true,
      "sendEnabled": true,
      "upgradeEnabled": true,
      "playbackEnabled": true
    },
    "reactionsEnabled": true,
    "recording": {
      "enabled": true,
      "audioEnabled": true,
      "videoEnabled": true,
      "autoRecordEnabled": true,
      "incomingAudioRecordingEnabled": true,
      "outgoingAudioRecordingEnabled": true,
      "mixedAudioEnabled": true,
      "stereoAudioEnabled": false,
      "incomingVideoRecordingEnabled": true,
      "outgoingVideoRecordingEnabled": true,
      "generateFinalAudioEnabled": true,
      "generateFinalVideoEnabled": false,
      "keepRawRecordingFiles": true,
      "retentionDays": 7,
      "consentRequired": false
    },
    "autoAnswer": {
      "enabled": false,
      "delayMs": 0
    },
    "diagnosticsEnabled": false,
    "limits": {
      "maxConcurrentCalls": 1,
      "ringTimeoutSeconds": 60,
      "connectTimeoutSeconds": 45,
      "maxCallDurationSeconds": 3600
    }
  }'
```

Retorno `200`:

```json
{
  "instance": {
      "id": 1,
      "name": "test_001"
  },
  "settings": {
    "callsEnabled": true,
    "incomingCallsEnabled": true,
    "outgoingCallsEnabled": true,
    "audio": {
      "enabled": true,
      "receiveEnabled": true,
      "sendEnabled": true,
      "playbackEnabled": true,
      "streamingEnabled": true
    },
    "video": {
      "enabled": true,
      "receiveEnabled": true,
      "sendEnabled": true,
      "upgradeEnabled": true,
      "playbackEnabled": true
    },
    "reactionsEnabled": true,
    "recording": {
      "enabled": true,
      "audioEnabled": true,
      "videoEnabled": true,
      "autoRecordEnabled": true,
      "incomingAudioRecordingEnabled": true,
      "outgoingAudioRecordingEnabled": true,
      "mixedAudioEnabled": true,
      "stereoAudioEnabled": false,
      "incomingVideoRecordingEnabled": true,
      "outgoingVideoRecordingEnabled": true,
      "generateFinalAudioEnabled": true,
      "generateFinalVideoEnabled": false,
      "keepRawRecordingFiles": true,
      "retentionDays": 7,
      "maxDiskMb": null,
      "consentRequired": false,
      "noticeText": null
    },
    "diagnosticsEnabled": false,
    "autoAnswer": {
      "enabled": false,
      "delayMs": 0,
      "audioMediaId": null,
      "videoMediaId": null
    },
    "limits": {
      "maxConcurrentCalls": 1,
      "ringTimeoutSeconds": 60,
      "connectTimeoutSeconds": 45,
      "maxCallDurationSeconds": 3600
    }
  },
  "effective": {
    "callsEnabled": true,
    "incomingCallsEnabled": true,
    "outgoingCallsEnabled": true,
    "audioEnabled": true,
    "audioReceiveEnabled": true,
    "audioSendEnabled": true,
    "audioPlaybackEnabled": true,
    "audioStreamingEnabled": true,
    "videoEnabled": true,
    "videoReceiveEnabled": true,
    "videoSendEnabled": true,
    "videoUpgradeEnabled": true,
    "videoPlaybackEnabled": true,
    "reactionsEnabled": true,
    "recordingEnabled": true,
    "audioRecordingEnabled": true,
    "videoRecordingEnabled": true,
    "autoRecordEnabled": true,
    "incomingAudioRecordingEnabled": true,
    "outgoingAudioRecordingEnabled": true,
    "mixedAudioEnabled": true,
    "stereoAudioEnabled": false,
    "incomingVideoRecordingEnabled": true,
    "outgoingVideoRecordingEnabled": true,
    "generateFinalAudioEnabled": true,
    "generateFinalVideoEnabled": false,
    "keepRawRecordingFiles": true,
    "recordingRetentionDays": 7,
    "recordingConsentRequired": false,
    "diagnosticsEnabled": false,
    "autoAnswerEnabled": false,
    "maxConcurrentCalls": 1,
    "ringTimeoutSeconds": 60,
    "connectTimeoutSeconds": 45,
    "maxCallDurationSeconds": 3600
  }
}
```

### `GET /call/{instanceName}/{callId}`

Busca uma chamada específica.

Use para consultar o estado atual antes de executar comandos como `/answer`, `/hangup`, `/recording/start` ou para verificar o estado final depois de um evento provider. Retorna histórico persistido mesmo quando o runtime em memória já foi limpo.

Exemplo:

```bash
curl "$API/call/$INSTANCE/$CALL_ID" \
  -H "Authorization: Bearer $TOKEN"
```

Retorno `200`:

```json
{
  "id": "01900000-0000-7000-8000-000000000000",
  "instanceId": 42,
  "instance": "test_001",
  "provider": "meowcaller",
  "providerCallId": "00CD1D448E1522C15C544689DCE0C6F0",
  "direction": "incoming",
  "status": "RINGING",
  "peer": "5531999999999",
  "audio": true,
  "video": false,
  "recordingStatus": "NOT_REQUESTED",
  "startedAt": "2026-07-23T20:00:00Z",
  "ringingAt": "2026-07-23T20:00:01Z",
  "durationSeconds": 0,
  "version": 2,
  "stateVersion": 2,
  "createdAt": "2026-07-23T20:00:00Z",
  "updatedAt": "2026-07-23T20:00:01Z"
}
```

### `GET /call/{instanceName}/{callId}/events`

Lista eventos persistidos da chamada.

Use para auditoria, reprocessamento de integrações, diagnóstico de corrida e confirmação de sequência. Os eventos são append-only e possuem sequência monotônica por chamada.

Exemplo:

```bash
curl "$API/call/$INSTANCE/$CALL_ID/events?limit=50" \
  -H "Authorization: Bearer $TOKEN"
```

Retorno `200`:

```json
{
  "data": [
    {
      "id": "01900000-0000-7000-8000-000000000020",
      "callId": "01900000-0000-7000-8000-000000000000",
      "type": "call.incoming",
      "sequence": 1,
      "payload": {
        "event": "call.incoming",
        "instance": "test_001",
        "instanceId": 42
      },
      "occurredAt": "2026-07-23T20:00:01Z",
      "createdAt": "2026-07-23T20:00:01Z"
    }
  ]
}
```

### `POST /call/{instanceName}/{callId}/answer`

Atende uma chamada recebida pela API.

Use quando a chamada está `RINGING`, `INCOMING` ou em estado compatível e a API deve assumir o relay de mídia. O endpoint grava a intenção `answer_requested_by=api` antes de chamar `call.Answer()`. Quando o provider fica pronto, `OnReady` move a chamada para `ACTIVE` e grava `answered_by=api`.

Exemplo:

```bash
curl -X POST "$API/call/$INSTANCE/$PROVIDER_CALL_ID/answer" \
  -H "Authorization: Bearer $TOKEN"
```

Retorno `200`:

```json
{
  "id": "01900000-0000-7000-8000-000000000000",
  "instanceId": 42,
  "instance": "test_001",
  "provider": "meowcaller",
  "providerCallId": "00CD1D448E1522C15C544689DCE0C6F0",
  "direction": "incoming",
  "status": "CONNECTING",
  "peer": "5531999999999",
  "audio": true,
  "video": false,
  "answeredBy": "api",
  "answerRequestedBy": "api",
  "startedAt": "2026-07-23T20:00:00Z",
  "answeredAt": "2026-07-23T20:00:03Z",
  "durationSeconds": 0,
  "version": 3,
  "stateVersion": 3,
  "createdAt": "2026-07-23T20:00:00Z",
  "updatedAt": "2026-07-23T20:00:03Z"
}
```

Conflito `409` quando outro dispositivo já atendeu:

```json
{
  "status": 409,
  "error": "call_answered_elsewhere",
  "message": "This call was answered on another linked device.",
  "call": {
    "id": "01900000-0000-7000-8000-000000000000",
    "status": "ANSWERED_ELSEWHERE",
    "answeredBy": "another_device",
    "endedBy": "another_device",
    "endReason": "accepted_elsewhere"
  }
}
```

### `POST /call/{instanceName}/{callId}/reject`

Rejeita uma chamada recebida antes de atendimento local.

Use quando a API recebeu uma chamada e deve recusá-la. Não use para chamadas já ativas; para encerrar chamada ativa use `/hangup`.

Exemplo:

```bash
curl -X POST "$API/call/$INSTANCE/$CALL_ID/reject" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason":"operator_rejected"}'
```

Retorno `200`:

```json
{
  "id": "01900000-0000-7000-8000-000000000000",
  "instanceId": 42,
  "instance": "test_001",
  "provider": "meowcaller",
  "providerCallId": "00CD1D448E1522C15C544689DCE0C6F0",
  "direction": "incoming",
  "status": "REJECTED",
  "peer": "5531999999999",
  "audio": true,
  "video": false,
  "endedBy": "api",
  "endReason": "operator_rejected",
  "endedAt": "2026-07-23T20:00:05Z",
  "durationSeconds": 0,
  "version": 3,
  "stateVersion": 3,
  "createdAt": "2026-07-23T20:00:00Z",
  "updatedAt": "2026-07-23T20:00:05Z"
}
```

### `POST /call/{instanceName}/{callId}/hangup`

Encerra uma chamada em andamento.

Use quando a chamada já foi atendida ou está em conexão e a API deve desligar para os dois lados. Esse endpoint chama `call.Hangup()` no provider. Ele não é equivalente a `/audio/stop` ou `/video/stop`; esses últimos apenas param mídia local da API.

Exemplo:

```bash
curl -X POST "$API/call/$INSTANCE/$CALL_ID/hangup" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason":"user_hangup"}'
```

Retorno `200`:

```json
{
  "id": "01900000-0000-7000-8000-000000000000",
  "instanceId": 42,
  "instance": "test_001",
  "provider": "meowcaller",
  "providerCallId": "00CD1D448E1522C15C544689DCE0C6F0",
  "direction": "incoming",
  "status": "ENDED",
  "peer": "5531999999999",
  "audio": true,
  "video": false,
  "answeredBy": "api",
  "endedBy": "api",
  "endReason": "user_hangup",
  "connectedAt": "2026-07-23T20:00:04Z",
  "endedAt": "2026-07-23T20:01:00Z",
  "durationSeconds": 56,
  "version": 6,
  "stateVersion": 6,
  "createdAt": "2026-07-23T20:00:00Z",
  "updatedAt": "2026-07-23T20:01:00Z"
}
```

### `POST /call/{instanceName}/{callId}/audio/play`

Toca áudio na chamada a partir de uma URL HTTP(S).

Use para enviar áudio da API para a chamada, por exemplo uma saudação, fila de espera ou arquivo gerado por outro serviço. O endpoint aceita MP3, WAV PCM e Ogg/Opus quando o `Content-Type` remoto é reconhecido. A URL passa por proteção SSRF e limite de tamanho.

Exemplo:

```bash
curl -X POST "$API/call/$INSTANCE/$CALL_ID/audio/play" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://cdn.example.com/audio/hello.wav",
    "replaceCurrent": true,
    "loop": false
  }'
```

Retorno `200`:

```json
{
  "status": "playing"
}
```

### `POST /call/{instanceName}/{callId}/audio/stop`

Para o áudio que a API está tocando.

Use para interromper playback iniciado por `/audio/play`. Esse endpoint não desliga a chamada, não muta o microfone do WhatsApp e não corta áudio remoto. Para encerrar a ligação, use `/hangup`.

Exemplo:

```bash
curl -X POST "$API/call/$INSTANCE/$CALL_ID/audio/stop" \
  -H "Authorization: Bearer $TOKEN"
```

Retorno `200`:

```json
{
  "status": "stopped"
}
```

### `POST /call/{instanceName}/{callId}/video/start`

Solicita início ou upgrade de vídeo local.

Use quando a API deve iniciar envio de vídeo pela chamada. A mídia esperada pelo provider é H.264 Annex-B, não MP4/WebM. Essa rota sinaliza início/upgrade; o envio de frames é feito internamente pelo provider.

Exemplo:

```bash
curl -X POST "$API/call/$INSTANCE/$CALL_ID/video/start" \
  -H "Authorization: Bearer $TOKEN"
```

Retorno `200`:

```json
{
  "status": "ok"
}
```

### `POST /call/{instanceName}/{callId}/video/accept`

Aceita uma solicitação de upgrade de vídeo recebida.

Use quando o outro lado iniciou uma solicitação de vídeo e a API deve aceitar. Exige vídeo recebido e upgrade habilitados na configuração efetiva.

Exemplo:

```bash
curl -X POST "$API/call/$INSTANCE/$CALL_ID/video/accept" \
  -H "Authorization: Bearer $TOKEN"
```

Retorno `200`:

```json
{
  "status": "ok"
}
```

### `POST /call/{instanceName}/{callId}/video/reject`

Rejeita uma solicitação de upgrade de vídeo.

Na versão atual, a rota existe, mas o provider fixado não expõe rejeição explícita de upgrade de vídeo. Por isso ela retorna recurso não suportado.

Exemplo:

```bash
curl -X POST "$API/call/$INSTANCE/$CALL_ID/video/reject" \
  -H "Authorization: Bearer $TOKEN"
```

Retorno `422`:

```json
{
  "statusCode": 422,
  "error": "unprocessable-entity",
  "messages": [
    "Entidade nao processavel."
  ]
}
```

### `POST /call/{instanceName}/{callId}/video/stop`

Para o vídeo local enviado pela API.

Use para parar o envio de vídeo sem encerrar a chamada. Esse endpoint não desliga a ligação. Para desligar, use `/hangup`.

Exemplo:

```bash
curl -X POST "$API/call/$INSTANCE/$CALL_ID/video/stop" \
  -H "Authorization: Bearer $TOKEN"
```

Retorno `200`:

```json
{
  "status": "ok"
}
```

### `POST /call/{instanceName}/{callId}/video/orientation`

Atualiza a orientação do vídeo local.

Use quando o produtor de vídeo da API mudou orientação. O valor aceito é inteiro de `0` a `3`, seguindo o mapeamento esperado pelo provider.

Exemplo:

```bash
curl -X POST "$API/call/$INSTANCE/$CALL_ID/video/orientation" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"orientation":0}'
```

Retorno `200`:

```json
{
  "status": "updated"
}
```

### `POST /call/{instanceName}/{callId}/video/play`

Reservado para playback de vídeo.

Na versão atual, a rota está registrada, mas não está implementada. Não há transcoding por URL/container para vídeo.

Exemplo:

```bash
curl -X POST "$API/call/$INSTANCE/$CALL_ID/video/play" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://cdn.example.com/video/sample.mp4"}'
```

Retorno `422`:

```json
{
  "statusCode": 422,
  "error": "unprocessable-entity",
  "messages": [
    "Entidade nao processavel."
  ]
}
```

### `POST /call/{instanceName}/{callId}/video/stop-playback`

Reservado para parar playback de vídeo.

Na versão atual, a rota está registrada, mas não está implementada. Ela não para vídeo local iniciado por `/video/start`; para isso use `/video/stop`.

Exemplo:

```bash
curl -X POST "$API/call/$INSTANCE/$CALL_ID/video/stop-playback" \
  -H "Authorization: Bearer $TOKEN"
```

Retorno `422`:

```json
{
  "statusCode": 422,
  "error": "unprocessable-entity",
  "messages": [
    "Entidade nao processavel."
  ]
}
```

### `POST /call/{instanceName}/{callId}/reaction`

Envia uma reação emoji na chamada.

Use para enviar uma reação curta durante chamada ativa. O emoji precisa ser não vazio e ter até 4 runes.

Exemplo:

```bash
curl -X POST "$API/call/$INSTANCE/$CALL_ID/reaction" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"emoji":"👍"}'
```

Retorno `200`:

```json
{
  "status": "sent"
}
```

### `GET /call/{instanceName}/{callId}/recordings`

Lista gravações da chamada.

Use para descobrir quais arquivos foram criados, seus formatos, status, tamanho e IDs para download. Pode retornar lista vazia quando a chamada não teve mídia na API, quando a gravação não foi iniciada ou quando outro dispositivo atendeu.

Exemplo:

```bash
curl "$API/call/$INSTANCE/$CALL_ID/recordings" \
  -H "Authorization: Bearer $TOKEN"
```

Retorno `200`:

```json
{
  "data": [
    {
      "id": "01900000-0000-7000-8000-000000000010",
      "instanceId": 42,
      "callId": "01900000-0000-7000-8000-000000000000",
      "type": "audio",
      "mediaType": "audio",
      "direction": "incoming",
      "format": "wav",
      "relativePath": "42/2026/07/01900000-0000-7000-8000-000000000000/audio-in.wav",
      "sizeBytes": 128044,
      "durationSeconds": 4,
      "durationMs": 4000,
      "sampleRate": 16000,
      "channels": 1,
      "audioCodec": "pcm_s16le",
      "checksumSha256": "abc123",
      "status": "COMPLETED",
      "startedAt": "2026-07-23T20:00:04Z",
      "completedAt": "2026-07-23T20:01:00Z",
      "expiresAt": "2026-07-30T20:01:00Z",
      "createdAt": "2026-07-23T20:00:04Z",
      "updatedAt": "2026-07-23T20:01:00Z",
      "downloadAvailable": true
    }
  ]
}
```

### `POST /call/{instanceName}/{callId}/recording/start`

Inicia gravação local em disco.

Use quando a chamada está `CONNECTING` ou `ACTIVE` e a API possui mídia. Se a configuração da instância tem `recording.consentRequired=true`, envie `consentGranted=true` ou `consentAt`.

Exemplo:

```bash
curl -X POST "$API/call/$INSTANCE/$CALL_ID/recording/start" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "audio": true,
    "video": true,
    "incomingAudio": true,
    "outgoingAudio": true,
    "incomingVideo": true,
    "outgoingVideo": true,
    "consentGranted": true,
    "reason": "manual"
  }'
```

Retorno `202`:

```json
{
  "data": [
    {
      "id": "01900000-0000-7000-8000-000000000010",
      "instanceId": 42,
      "callId": "01900000-0000-7000-8000-000000000000",
      "type": "audio",
      "mediaType": "audio",
      "direction": "incoming",
      "format": "wav",
      "temporaryRelativePath": "42/2026/07/01900000-0000-7000-8000-000000000000/audio-in.wav.tmp",
      "status": "RECORDING",
      "startedAt": "2026-07-23T20:00:04Z",
      "expiresAt": "2026-07-30T20:00:04Z",
      "createdAt": "2026-07-23T20:00:04Z",
      "updatedAt": "2026-07-23T20:00:04Z",
      "downloadAvailable": false
    }
  ]
}
```

### `POST /call/{instanceName}/{callId}/recording/stop`

Para a gravação local ativa e finaliza metadados.

Use para encerrar manualmente uma gravação antes do fim da chamada. No fim da chamada, o cleanup também tenta parar gravações ativas de forma idempotente.

Exemplo:

```bash
curl -X POST "$API/call/$INSTANCE/$CALL_ID/recording/stop" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason":"operator_stop"}'
```

Retorno `200`:

```json
{
  "data": [
    {
      "id": "01900000-0000-7000-8000-000000000010",
      "instanceId": 42,
      "callId": "01900000-0000-7000-8000-000000000000",
      "type": "audio",
      "mediaType": "audio",
      "direction": "incoming",
      "format": "wav",
      "relativePath": "42/2026/07/01900000-0000-7000-8000-000000000000/audio-in.wav",
      "sizeBytes": 128044,
      "durationSeconds": 4,
      "durationMs": 4000,
      "status": "COMPLETED",
      "completedAt": "2026-07-23T20:01:00Z",
      "downloadAvailable": true,
      "createdAt": "2026-07-23T20:00:04Z",
      "updatedAt": "2026-07-23T20:01:00Z"
    }
  ]
}
```

### `GET /call/{instanceName}/{callId}/recordings/{recordingId}`

Busca metadados de uma gravação.

Use antes de baixar ou excluir arquivo, ou para verificar se `downloadAvailable=true`.

Exemplo:

```bash
curl "$API/call/$INSTANCE/$CALL_ID/recordings/$RECORDING_ID" \
  -H "Authorization: Bearer $TOKEN"
```

Retorno `200`:

```json
{
  "id": "01900000-0000-7000-8000-000000000010",
  "instanceId": 42,
  "callId": "01900000-0000-7000-8000-000000000000",
  "type": "audio",
  "mediaType": "audio",
  "direction": "incoming",
  "format": "wav",
  "relativePath": "42/2026/07/01900000-0000-7000-8000-000000000000/audio-in.wav",
  "sizeBytes": 128044,
  "durationSeconds": 4,
  "durationMs": 4000,
  "sampleRate": 16000,
  "channels": 1,
  "audioCodec": "pcm_s16le",
  "checksumSha256": "abc123",
  "status": "COMPLETED",
  "startedAt": "2026-07-23T20:00:04Z",
  "completedAt": "2026-07-23T20:01:00Z",
  "expiresAt": "2026-07-30T20:01:00Z",
  "createdAt": "2026-07-23T20:00:04Z",
  "updatedAt": "2026-07-23T20:01:00Z",
  "downloadAvailable": true
}
```

### `GET /call/{instanceName}/{callId}/recordings/{recordingId}/download`

Baixa o arquivo local da gravação.

Use quando `downloadAvailable=true`. A API resolve o caminho relativo no servidor, bloqueia traversal e entrega o arquivo com `Content-Disposition` de download.

Exemplo:

```bash
curl -L "$API/call/$INSTANCE/$CALL_ID/recordings/$RECORDING_ID/download" \
  -H "Authorization: Bearer $TOKEN" \
  -o audio-in.wav
```

Retorno `200`:

```http
HTTP/1.1 200 OK
Content-Type: audio/wav
Content-Disposition: attachment; filename="audio-in.wav"

<bytes do arquivo>
```

### `DELETE /call/{instanceName}/{callId}/recordings/{recordingId}`

Exclui logicamente uma gravação e tenta remover o arquivo local.

Use para remoção manual antes da retenção automática. A exclusão é idempotente do ponto de vista de storage: se o metadado foi removido e o arquivo já não existe, a ausência do arquivo é tolerada.

Exemplo:

```bash
curl -X DELETE "$API/call/$INSTANCE/$CALL_ID/recordings/$RECORDING_ID" \
  -H "Authorization: Bearer $TOKEN"
```

Retorno `204`:

```http
HTTP/1.1 204 No Content
```

## Eventos

Eventos são append-only em `CallEvent` e enviados pelo envelope padrão de webhook/WebSocket.

Envelope:

```json
{
  "event": "call.incoming",
  "instance": "test_001",
  "instanceId": 42,
  "call": {
    "id": "01900000-0000-7000-8000-000000000000",
    "providerCallId": "ABC123",
    "peer": "5531999999999",
    "direction": "incoming",
    "status": "RINGING",
    "audio": true,
    "video": false
  },
  "data": {},
  "sequence": 1,
  "timestamp": "2026-07-23T20:00:00Z"
}
```

Eventos multi-device:

- `call.answered_elsewhere`
- `call.rejected_elsewhere`

Eventos de gravação:

- `call.recording.started`
- `call.recording.completed`
- `call.recording.partial`
- `call.recording.failed`
- `call.recording.unavailable`
- `call.recording.deleted`
- `call.recording.expired`

Exemplo de `call.recording.unavailable`:

```json
{
  "event": "call.recording.unavailable",
  "instance": "test_001",
  "instanceId": 42,
  "call": {
    "providerCallId": "ABC123",
    "status": "ANSWERED_ELSEWHERE",
    "answeredBy": "another_device",
    "endedBy": "another_device",
    "endReason": "accepted_elsewhere",
    "audio": true,
    "video": false
  },
  "data": {
    "reason": "media_owned_by_another_device",
    "mediaAvailableInApi": false
  }
}
```

Eventos nunca incluem bytes de mídia.

## WebSocket

Eventos de ciclo de vida de chamada usam o publicador WebSocket de eventos da instância. Assine eventos `call.*` usando o modelo de autenticação WebSocket já existente.

A rota binária de mídia WebSocket planejada para `/ws/instance/calls/media` não está habilitada nesta versão. Atualmente a mídia entra por playback REST de URL e por sinks do provider. Clientes lentos de WebSocket de ciclo de vida são tratados pelo buffer limitado já existente.

## Mídia

O áudio interno do `meowcaller` é PCM `float32` mono a 16 kHz em frames de 60 ms. Playback por URL aceita HTTP(S) MP3, WAV PCM e Ogg/Opus quando o `Content-Type` remoto é reconhecido.

Controles de segurança:

- Apenas HTTP/HTTPS.
- Hosts privados, loopback, link-local e endereços de metadata são bloqueados por padrão.
- Timeout de download vem de `CALLS_MEDIA_DOWNLOAD_TIMEOUT_SECONDS`.
- Limite de tamanho vem de `CALLS_MEDIA_MAX_SIZE_MB`.
- Arquivos temporários são gerados pelo servidor e removidos pelo closer da source.

MP4/WebM são containers, não access units H.264 Annex-B.

## Vídeo

`meowcaller` transporta access units H.264 Annex-B. A API expõe rotas para iniciar, aceitar, rejeitar, parar e orientar vídeo. A rejeição explícita de upgrade de vídeo retorna `call_feature_not_supported` porque a API pública fixada do provider não expõe esse método.

Envio de frames H.264 Annex-B está disponível internamente pela interface do provider. Transcoding por URL/container com FFmpeg não está habilitado nesta versão.

## Gravação

Gravação é controlada pelas variáveis globais `CALLS_RECORDING_*` e pelas configurações por instância. Por padrão, gravação fica desligada com `CALLS_RECORDING_ENABLED=false`.

A API grava apenas mídia disponível no processo da API. Quando a API atende uma chamada e `meowcaller` chega a `ACTIVE`, áudio recebido pode ser anexado por `ReceiveAudio`, áudio enviado é capturado pelo wrapper da source de `PlayAudio`, vídeo recebido pode ser anexado por `ReceiveVideo` e frames H.264 enviados são copiados antes do envio.

Quando o smartphone ou outro dispositivo vinculado atende, rejeita ou encerra a chamada antes de a API possuir mídia, nenhum arquivo de gravação é criado. A chamada é marcada com:

```json
{
  "recordingStatus": "UNAVAILABLE",
  "recordingUnavailableReason": "media_owned_by_another_device"
}
```

Se `recording.consentRequired=true` na instância, `/recording/start` retorna `422` exceto quando `consentGranted=true` ou `consentAt` é enviado.

Formatos:

- Áudio: WAV PCM 16-bit mono, 16 kHz.
- Vídeo: H.264 Annex-B bruto.

Arquivos finais muxados de áudio/vídeo exigem timeline confiável de mídia e processamento FFmpeg. A implementação atual mantém trilhas brutas e não promete um MP4 sincronizado.

## Armazenamento de Gravações

Bytes de mídia são gravados em disco local sob `CALLS_RECORDING_DIRECTORY`.

Layout:

```text
{recording_directory}/{instance_id}/{yyyy}/{mm}/{call_id}/{track}.{ext}
```

Exemplo:

```text
./data/calls/42/2026/07/01900000-0000-7000-8000-000000000000/audio-in.wav
```

As APIs públicas expõem apenas paths relativos e IDs internos de gravação. O download resolve o path relativo no servidor e rejeita traversal ou paths absolutos.

O PostgreSQL armazena metadados em `"CallRecording"`, incluindo:

- `"instanceId"`
- `"callId"`
- `type`
- `direction`
- `format`
- `"relativePath"`
- `"sizeBytes"`
- `"durationMs"`
- `"checksumSHA256"`
- `status`
- `"expiresAt"`

Bytes de mídia nunca são armazenados no PostgreSQL.

O diretório é criado e testado para escrita durante o carregamento da configuração.

## Retenção de Gravações

Cada gravação armazena `"expiresAt"`, calculado pela retenção efetiva da instância:

```text
retenção efetiva = instance recording.retentionDays ou CALLS_RECORDING_DEFAULT_RETENTION_DAYS
```

`CALLS_RECORDING_MAX_RETENTION_DAYS` é o valor máximo aceito nas configurações da instância.

O schema suporta exclusão lógica por `deleted_at` e status `DELETED`. A limpeza física de arquivos expirados deve ser executada pelo worker de retenção quando agendado; exclusão manual está disponível por:

```http
DELETE /call/{instanceName}/{callId}/recordings/{recordingId}
```

O endpoint de exclusão remove o metadado logicamente e tenta remover o arquivo local. Arquivo ausente após exclusão de metadado é tolerado porque o cleanup de storage é idempotente.

## Recuperação de Gravações

O shutdown de gravação é idempotente. Quando uma chamada termina, é perdida, falha, é interrompida ou é reconciliada como atendida/rejeitada em outro dispositivo, `CallService.cleanupRuntime` pede ao manager de gravação para parar qualquer recorder ativo antes de remover índices de runtime.

Em shutdown controlado, o serviço fecha trilhas de gravação ativas antes de desligar o provider de chamada. Headers WAV são finalizados durante o fechamento.

Expectativas de recuperação:

- Arquivos `.tmp` podem existir após crash do processo.
- Linhas de metadados podem permanecer em `RECORDING` se o processo sair antes do shutdown.
- Operadores podem inspecionar o diretório por `instance_id/year/month/call_id`.
- Trilhas H.264 brutas não são apagadas automaticamente, exceto pelo endpoint de exclusão ou limpeza de retenção.

Para chamadas multi-device atendidas no smartphone, recuperação não é necessária porque nenhum writer local de mídia é criado.

## Segurança

Esta é uma integração não oficial com o WhatsApp. Operadores são responsáveis por risco da conta, consentimento dos usuários e legislação local.

Controles incluídos:

- autorização por token da instância;
- uma chamada por requisição, sem batch calling;
- limites globais e por instância de concorrência;
- proteção SSRF para downloads de mídia;
- ausência de chaves de chamada, chaves SRTP, tokens ou mídia bruta em metadados de chamada;
- diagnósticos desligados por padrão;
- gravação desligada por padrão;
- proteção contra path traversal em download de gravações.

Diagnósticos podem conter dados altamente sensíveis de protocolo/mídia e devem ser tratados como arquivos restritos do servidor.

## Validação Manual

Testes reais do WhatsApp não fazem parte do CI normal. Use apenas contas e números próprios ou explicitamente autorizados.

Habilite chamadas explicitamente:

```env
CALLS_ENABLED=true
CALLS_LIVE_TESTS_ENABLED=true
```

Cenário A - atender pela API:

1. Conecte a instância.
2. Ligue para a conta.
3. Confirme `call.incoming`.
4. Chame `/answer`.
5. Confirme `CONNECTING`.
6. Confirme `call.active`.
7. Confirme que a mídia está disponível na API.
8. Desligue.
9. Confirme `ENDED`.

Cenário B - atender pelo smartphone:

1. Conecte a instância.
2. Ligue para a conta.
3. Confirme `call.incoming` se houver tempo.
4. Atenda no smartphone.
5. Confirme `call.answered_elsewhere`.
6. Confirme `ANSWERED_ELSEWHERE`.
7. Confirme que não há mídia na API.
8. Confirme que o registry de runtime foi limpo.
9. Confirme que `/answer` retorna `409`.

Cenário C - atendimento rápido:

1. Ligue para a conta.
2. Atenda imediatamente no smartphone.
3. Verifique se o observer bruto registra a chamada.
4. Confirme que nenhum runtime foi criado.
5. Confirme `ANSWERED_ELSEWHERE`.

Cenário D - rejeitar no smartphone:

1. Ligue para a conta.
2. Rejeite no smartphone.
3. Confirme `call.rejected_elsewhere` ou motivo equivalente.
4. Confirme cleanup do runtime.

## Solução de Problemas

`/answer` retorna `404`:

Use o UUID interno da chamada ou um provider call ID persistido que pertence à instância. Se o observer bruto ainda não viu dados suficientes e `OnIncomingCall` não disparou, o provider ID pode não ser consultável até que o evento de auditoria seja persistido.

`/answer` retorna `409`:

A chamada já está terminal ou foi tratada em outro dispositivo. Para `ANSWERED_ELSEWHERE`, o smartphone ou outro dispositivo vinculado possui a mídia; a API não deve chamar `Answer`, `Reject` ou `Hangup` para essa chamada.

`/hangup` retorna conflito:

Verifique `GET /call/{instanceName}/{callId}`. Se a chamada já estiver em estado terminal, ela já foi encerrada pelo provider, pela API, pelo peer ou por outro dispositivo. Se ainda estiver ativa e o provider não encontrar runtime, confirme se a chamada foi atendida pela API e não pelo smartphone.

Sem arquivos em `CALLS_RECORDING_DIRECTORY`:

Arquivos só são criados depois que a gravação local começa enquanto a API possui mídia. Chamadas atendidas no smartphone não criam arquivos de áudio/vídeo. Verifique:

- `CALLS_RECORDING_ENABLED=true`
- `CALLS_RECORDING_DIRECTORY=./data/calls`
- `recording.enabled=true` na instância
- flags de gravação de áudio/vídeo da instância
- estado da chamada é `CONNECTING` ou `ACTIVE`
- `consentGranted=true` quando consentimento é obrigatório
- a chamada foi atendida pela API, não por outro dispositivo

Vídeo bruto é `.h264`:

A implementação atual armazena vídeo como H.264 Annex-B bruto. Ela não promete um MP4 sincronizado sem timeline confiável e processamento FFmpeg.

Outras verificações:

- Instância não conectada: conecte a instância primeiro; chamadas exigem `whatsmeow.Client` pronto.
- API não recebe eventos de chamada: confira `CALLS_ENABLED=true` e `callsEnabled=true` na instância; caso contrário, a instância está intencionalmente passiva e as chamadas devem continuar no telefone vinculado.
- Chamada nunca vira `ACTIVE`: inspecione eventos de relay/connect e `connectTimeoutSeconds`.
- URL de áudio rejeitada: confira content type, tamanho, destino DNS e bloqueio de IP privado.
- Vídeo falha: confirme que a entrada é H.264 Annex-B, não MP4.
- Reinício da aplicação: chamadas não terminais são marcadas como `INTERRUPTED` com `application_restart`.
