# API, eventos e dashboard de chamadas

Este guia concentra o contrato HTTP, eventos em tempo real, WebSocket de midia e orientacoes para o `codechat-dashboard`. Para os fluxos operacionais de chamada de saida, chamada recebida, atendimento, midia e encerramento, consulte `calls-flows.md`. A referencia extensa continua em `calls.md`.

## Capacidades e erros

`GET /call/{instanceName}/capabilities` descreve o provider instalado. Fluxos de grupo, links, lobby, participantes, mao levantada, screen share, WebSocket v2 e gravacao atribuida dependem de capabilities e flags por instancia. Quando o provider nao possui uma extensao opcional, a API retorna `501 call_feature_not_supported`. Quando a capability existe mas a instancia nao habilitou a flag, a API retorna erro de permissao/configuracao, como `403`.

Scheduling e remocao remota de participante estao reservados no contrato, mas indisponiveis na revisao atual do provider.

## Endpoints principais

- `POST /call/{instanceName}`: inicia chamada direta de saida.
- `GET /call/{instanceName}`: lista historico.
- `GET /call/{instanceName}/active`: lista slots ativos reconciliados.
- `GET /call/{instanceName}/config`: consulta configuracao efetiva.
- `PUT /call/{instanceName}/config`: atualiza configuracao por instancia.
- `GET /call/{instanceName}/{callId}`: consulta uma chamada.
- `GET /call/{instanceName}/{callId}/events`: lista eventos persistidos.
- `POST /call/{instanceName}/{callId}/answer`: atende.
- `POST /call/{instanceName}/{callId}/reject`: rejeita.
- `POST /call/{instanceName}/{callId}/hangup`: encerra com terminate remoto controlado.
- `POST /call/{instanceName}/{callId}/audio/play`: injeta audio.
- `POST /call/{instanceName}/{callId}/audio/stop`: para injecao de audio.
- `POST /call/{instanceName}/{callId}/video/start`: inicia video local.
- `POST /call/{instanceName}/{callId}/video/accept`: aceita upgrade de video.
- `POST /call/{instanceName}/{callId}/video/reject`: rejeita upgrade de video.
- `POST /call/{instanceName}/{callId}/video/stop`: para video local.
- `POST /call/{instanceName}/{callId}/video/orientation`: atualiza orientacao.
- `POST /call/{instanceName}/{callId}/video/play`: injeta video.
- `POST /call/{instanceName}/{callId}/video/stop-playback`: para injecao de video.
- `POST /call/{instanceName}/{callId}/reaction`: envia reacao.

`POST /call/{instanceName}` retorna `409 call_concurrency_limit_exceeded` quando os slots ativos da instancia atingem `maxConcurrentCalls` depois da reconciliacao.

`POST /call/{instanceName}/{callId}/hangup` pode retornar `ENDING`, `ENDED`, `ENDED_UNCONFIRMED` ou `502 call_terminate_send_failed`. `ENDING` significa terminate em andamento ou chamada ja em encerramento; `ENDED_UNCONFIRMED` significa terminate enviado sem confirmacao remota ate o timeout.

## Grupos, links e participantes

- `POST /call/{instanceName}/groups/{groupId}`: inicia chamada em grupo existente.
- `POST /call/{instanceName}/group`: inicia grupo ad hoc com pelo menos dois participantes.
- `POST /call/{instanceName}/links`: cria call link.
- `GET /call/{instanceName}/links`: lista links locais.
- `GET /call/{instanceName}/links/{linkId}`: consulta link.
- `DELETE /call/{instanceName}/links/{linkId}`: faz soft-delete local; nao revoga URL remota do WhatsApp.
- `POST /call/{instanceName}/links/preview`: resolve metadados sanitizados por token ou URL.
- `POST /call/{instanceName}/links/{linkId}/join`: entra na sessao do link.
- `POST /call/{instanceName}/links/{linkId}/leave`: sai da sessao do link.
- `GET /call/{instanceName}/{callId}/participants`: lista roster.
- `POST /call/{instanceName}/{callId}/participants`: convida/adiciona participante quando suportado.
- `POST /call/{instanceName}/{callId}/participants/{participantId}/ring`: re-ring com limites e cooldown.
- `DELETE /call/{instanceName}/{callId}/participants/{participantId}`: reservado; retorna 501 enquanto o provider nao expor remocao.
- `GET /call/{instanceName}/{callId}/waiting`: lista sala de espera.
- `POST /call/{instanceName}/{callId}/waiting/{participantId}/admit`: admite participante.
- `POST /call/{instanceName}/{callId}/waiting/{participantId}/reject`: rejeita participante.
- `POST /call/{instanceName}/{callId}/waiting/admit-all`: admite em lote por operacoes individuais.
- `POST /call/{instanceName}/{callId}/waiting/reject-all`: rejeita em lote por operacoes individuais.

## Mao, reacoes, screen share e agendamento

- `POST /call/{instanceName}/{callId}/hand`: levanta a mao.
- `DELETE /call/{instanceName}/{callId}/hand`: baixa a mao.
- `POST /call/{instanceName}/{callId}/screen-share/start`: inicia sinalizacao de compartilhamento.
- `POST /call/{instanceName}/{callId}/screen-share/stop`: encerra sinalizacao.
- `GET /call/{instanceName}/{callId}/screen-share`: consulta estado.
- `POST/GET /call/{instanceName}/schedules`: rotas reservadas para agendamento.
- `GET/PATCH/DELETE /call/{instanceName}/schedules/{scheduleId}`: rotas reservadas; retornam 501 na revisao atual.

Reacoes aceitam `reaction` ou o campo legado `emoji`. A string e validada como UTF-8, normalizada em NFC, limitada a 64 bytes, rejeita NUL/caracteres de controle e aceita vazio para limpar. Texto/reacao ampliada exige `extendedReactionsEnabled`; emojis legados continuam funcionando. O limite em runtime e de 10 reacoes por chamada por segundo.

## Gravacoes

- `GET /call/{instanceName}/{callId}/recordings`
- `POST /call/{instanceName}/{callId}/recording/start`
- `POST /call/{instanceName}/{callId}/recording/stop`
- `GET /call/{instanceName}/{callId}/recordings/{recordingId}`
- `GET /call/{instanceName}/{callId}/recordings/{recordingId}/download`
- `GET /call/{instanceName}/{callId}/recordings/audio/download`
- `GET /call/{instanceName}/{callId}/recordings/video/incoming/download`
- `GET /call/{instanceName}/{callId}/recordings/video/outgoing/download`
- `DELETE /call/{instanceName}/{callId}/recordings/{recordingId}`

Gravacoes 1:1 mantem arquivos e endpoints anteriores. Em grupos, video atribuido gera originals por participante; audio individual nao esta disponivel no provider.

## Eventos

Grupos acrescentam familias `call.group.*`, `call.participant.*`, `call.link.*`, `call.hand.*` e `call.screen_share.*`. Eventos de participante carregam `participantId`, `participantJid`, `deviceJid` e `status`. Scheduling existe no modelo, mas nao e emitido enquanto a capability for falsa.

Eventos relevantes para concorrencia e encerramento:

- `call.hangup.requested`
- `call.ending`
- `call.terminate.sent`
- `call.terminate.confirmed`
- `call.terminate.retry`
- `call.terminate.failed`
- `call.ended`
- `call.ended_unconfirmed`

Exemplo:

```json
{
  "event": "call.terminate.sent",
  "instance": "codechat",
  "instanceId": 42,
  "call": {
    "id": "01900000-0000-7000-8000-000000000000",
    "providerCallId": "ABC123",
    "status": "ENDING"
  },
  "data": {
    "attempt": 1,
    "confirmed": false
  }
}
```

`call.ended_unconfirmed` significa que a API encerrou e limpou a sessao local apos timeout, mas nao recebeu confirmacao remota do terminate.

## WebSocket de midia

O protocolo v1 (`WMC1`) permanece default para chamadas diretas. Chamadas de grupo exigem `?protocolVersion=2`.

V2 usa magic `WMC2`, versao 2 e header binario com kind, sequence, timestamp, duracao, tamanho do metadata JSON e payload. O metadata contem call ID, participant ID/JID, device ID, track ID, direcao, media kind/source, SSRC, PID, orientacao e codec. Frames enviados ao servidor precisam ter o call ID da conexao e `direction=outgoing`.

O v2 entrega video por participante usando a identidade autenticada pelo provider. Audio de grupo continua sendo o mixer do provider e nao recebe participant ID falso.

## Contrato para dashboard

Chamadas diretas preservam o payload atual. Para `type=GROUP`, `AD_HOC_GROUP` ou `CALL_LINK`, renderize a resposta como `{call, participants}` e mantenha uma store indexada por `call.id` e `participant.id`.

Recomendacoes:

1. consultar `/capabilities` e esconder acoes nao suportadas;
2. adicionar feature flags da instancia, todas inicialmente desligadas;
3. criar roster com status, device, video, screen share e mao levantada;
4. tratar 501 `call_feature_not_supported` como indisponibilidade, nao como falha generica;
5. implementar links/preview/lobby sem exibir nem armazenar token em logs;
6. aplicar cooldown/contador visual no botao de re-ring;
7. negociar `protocolVersion=2` para grupos e manter v1 para diretas;
8. rotear video por participant/track/source; nao atribuir o audio mixado a um participante;
9. mostrar scheduling e remocao somente quando capabilities futuras forem `true`;
10. indicar que DELETE de link e remocao local, nao revogacao da URL.

Eventos novos devem atualizar incrementalmente o roster. Uma refetch de participantes continua sendo a fonte de reconciliacao apos reconnect.
