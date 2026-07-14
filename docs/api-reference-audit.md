# Auditoria da referência de API

Gerado em 2026-07-13 a partir do código executável em `../whatsapp-go-api` e da especificação `docs/openapi.yml`.

## Resumo

| Item | Quantidade |
| --- | ---: |
| Registros de rota no código | 96 |
| Operações HTTP distintas no código | 95 |
| Operações no OpenAPI | 95 |
| Operações atuais, sem classificação Pro | 43 |
| Operações Pro | 14 |
| Operações marcadas como deprecated | 37 |
| Schemas em components.schemas | 100 |
| Eventos de webhook por instância | 27 |
| Eventos globais de Message Batch | 14 |

Resultado da paridade: **o OpenAPI cobre todas as operações HTTP distintas registradas no código.**

## Endpoints encontrados no código

| Método | Caminho | Autenticação | Handler | Fonte |
| --- | --- | --- | --- | --- |
| `GET` | `/health` | Pública | `inline` | `internal/http/routes.go:33` |
| `GET` | `/ready` | Pública | `inline` | `internal/http/routes.go:37` |
| `POST` | `/instance` | API key global | `instanceHandler.Create` | `internal/http/routes.go:50` |
| `GET` | `/instance` | API key global | `instanceHandler.List` | `internal/http/routes.go:51` |
| `POST` | `/instance/create` | API key global | `instanceHandler.Create` | `internal/http/routes.go:53` |
| `GET` | `/instance/fetchInstances` | API key global | `instanceHandler.List` | `internal/http/routes.go:54` |
| `GET` | `/instance/fetchInstance/{instanceName}` | Bearer da instância | `instanceHandler.Fetch` | `internal/http/routes.go:55` |
| `PUT` | `/instance/refreshToken/{instanceName}` | Bearer da instância | `instanceHandler.RefreshToken` | `internal/http/routes.go:56` |
| `DELETE` | `/instance/delete/{instanceName}` | Bearer da instância | `whatsAppHandler.Delete` | `internal/http/routes.go:57` |
| `GET` | `/instance/connect/{instanceName}/code/{phoneNumber}` | Bearer da instância | `whatsAppHandler.ConnectPhone` | `internal/http/routes.go:60` |
| `POST` | `/instance/connect/{instanceName}/code` | Bearer da instância | `whatsAppHandler.ConnectPhone` | `internal/http/routes.go:61` |
| `POST` | `/instance/connect/{instanceName}/passkey/challenge` | Bearer da instância | `whatsAppHandler.RequestPasskeyChallenge` | `internal/http/routes.go:62` |
| `POST` | `/instance/connect/{instanceName}/passkey/assertion` | Bearer da instância | `whatsAppHandler.SubmitPasskeyAssertion` | `internal/http/routes.go:63` |
| `GET` | `/instance/connect/{instanceName}` | Bearer da instância | `whatsAppHandler.ConnectQRCode` | `internal/http/routes.go:64` |
| `POST` | `/instance/connect/{instanceName}` | Bearer da instância | `whatsAppHandler.ConnectQRCode` | `internal/http/routes.go:65` |
| `DELETE` | `/instance/logout/{instanceName}` | Bearer da instância | `whatsAppHandler.Logout` | `internal/http/routes.go:66` |
| `PUT` | `/webhook/set/{instanceName}` | Bearer da instância | `webhookHandler.Set` | `internal/http/routes.go:71` |
| `GET` | `/webhook/find/{instanceName}` | Bearer da instância | `webhookHandler.Find` | `internal/http/routes.go:72` |
| `POST` | `/message/sendText/{instanceName}` | Bearer da instância | `messageHandler.SendText` | `internal/http/routes.go:77` |
| `POST` | `/message/sendLink/{instanceName}` | Bearer da instância | `messageHandler.SendLink` | `internal/http/routes.go:78` |
| `POST` | `/message/sendMedia/{instanceName}` | Bearer da instância | `messageHandler.SendMedia` | `internal/http/routes.go:79` |
| `POST` | `/message/sendMediaFile/{instanceName}` | Bearer da instância | `messageHandler.SendMediaFile` | `internal/http/routes.go:80` |
| `POST` | `/message/sendWhatsAppAudio/{instanceName}` | Bearer da instância | `messageHandler.SendWhatsAppAudio` | `internal/http/routes.go:81` |
| `POST` | `/message/sendWhatsAppAudioFile/{instanceName}` | Bearer da instância | `messageHandler.SendWhatsAppAudioFile` | `internal/http/routes.go:82` |
| `POST` | `/message/sendContact/{instanceName}` | Bearer da instância | `messageHandler.SendContact` | `internal/http/routes.go:83` |
| `POST` | `/message/sendLocation/{instanceName}` | Bearer da instância | `messageHandler.SendLocation` | `internal/http/routes.go:84` |
| `POST` | `/message/sendReaction/{instanceName}` | Bearer da instância | `messageHandler.SendReaction` | `internal/http/routes.go:85` |
| `PATCH` | `/message/reviewOrder/{instanceName}` | Bearer da instância | `messageHandler.ReviewOrder` | `internal/http/routes.go:86` |
| `POST` | `/chat/whatsappNumbers/{instanceName}` | Bearer da instância | `chatHandler.WhatsAppNumbers` | `internal/http/routes.go:91` |
| `PATCH` | `/chat/readMessages/{instanceName}` | Bearer da instância | `chatHandler.ReadMessages` | `internal/http/routes.go:92` |
| `PUT` | `/chat/archiveChat/{instanceName}` | Bearer da instância | `chatHandler.ArchiveChat` | `internal/http/routes.go:93` |
| `DELETE` | `/chat/deleteMessage/{instanceName}` | Bearer da instância | `chatHandler.DeleteMessage` | `internal/http/routes.go:94` |
| `POST` | `/chat/fetchProfilePictureUrl/{instanceName}` | Bearer da instância | `chatHandler.FetchProfilePictureURL` | `internal/http/routes.go:95` |
| `POST` | `/chat/rejectCall/{instanceName}` | Bearer da instância | `chatHandler.RejectCall` | `internal/http/routes.go:96` |
| `POST` | `/chat/editMessage/{instanceName}` | Bearer da instância | `chatHandler.EditMessage` | `internal/http/routes.go:97` |
| `POST` | `/chat/mediaData/{instanceName}` | Bearer da instância | `chatHandler.MediaData` | `internal/http/routes.go:98` |
| `POST` | `/group/create/{instanceName}` | Bearer da instância | `groupHandler.Create` | `internal/http/routes.go:103` |
| `PUT` | `/group/updateGroupPicture/{instanceName}` | Bearer da instância | `groupHandler.UpdatePicture` | `internal/http/routes.go:104` |
| `GET` | `/group/inviteCode/{instanceName}` | Bearer da instância | `groupHandler.InviteCode` | `internal/http/routes.go:105` |
| `PUT` | `/group/revokeInviteCode/{instanceName}` | Bearer da instância | `groupHandler.RevokeInviteCode` | `internal/http/routes.go:106` |
| `PUT` | `/group/updateParticipant/{instanceName}` | Bearer da instância | `groupHandler.UpdateParticipant` | `internal/http/routes.go:107` |
| `DELETE` | `/group/leaveGroup/{instanceName}` | Bearer da instância | `groupHandler.Leave` | `internal/http/routes.go:108` |
| `GET` | `/instance/{instance}` | Bearer da instância | `instanceHandler.Fetch` | `internal/http/routes.go:113` |
| `DELETE` | `/instance/{instance}` | Bearer da instância | `whatsAppHandler.Delete` | `internal/http/routes.go:116` |
| `GET` | `/instance/{instance}/connection/status` | Bearer da instância | `whatsAppHandler.ConnectionState` | `internal/http/routes.go:117` |
| `GET` | `/instance/{instance}/connect` | Bearer da instância | `whatsAppHandler.ConnectQRCode` | `internal/http/routes.go:118` |
| `POST` | `/instance/{instance}/connect` | Bearer da instância | `whatsAppHandler.ConnectQRCode` | `internal/http/routes.go:119` |
| `GET` | `/instance/{instance}/connect/code/{phoneNumber}` | Bearer da instância | `whatsAppHandler.ConnectPhone` | `internal/http/routes.go:120` |
| `POST` | `/instance/{instance}/connect/code` | Bearer da instância | `whatsAppHandler.ConnectPhone` | `internal/http/routes.go:121` |
| `POST` | `/instance/{instance}/connect/passkey/challenge` | Bearer da instância | `whatsAppHandler.RequestPasskeyChallenge` | `internal/http/routes.go:123` |
| `POST` | `/instance/{instance}/connect/passkey/assertion` | Bearer da instância | `whatsAppHandler.SubmitPasskeyAssertion` | `internal/http/routes.go:124` |
| `DELETE` | `/instance/{instance}/logout/{instanceName}` | Bearer da instância | `whatsAppHandler.Logout` | `internal/http/routes.go:125` |
| `POST` | `/instance/{instance}/chat/is-account` | Bearer da instância | `chatHandler.WhatsAppNumbers` | `internal/http/routes.go:130` |
| `PATCH` | `/instance/{instance}/chat/read-message` | Bearer da instância | `chatHandler.ReadMessages` | `internal/http/routes.go:131` |
| `PUT` | `/instance/{instance}/chat/archive` | Bearer da instância | `chatHandler.ArchiveChat` | `internal/http/routes.go:132` |
| `DELETE` | `/instance/{instance}/chat/delete-message` | Bearer da instância | `chatHandler.DeleteMessage` | `internal/http/routes.go:133` |
| `POST` | `/instance/{instance}/chat/profile-picture` | Bearer da instância | `chatHandler.FetchProfilePictureURL` | `internal/http/routes.go:134` |
| `POST` | `/instance/{instance}/chat/reject-call` | Bearer da instância | `chatHandler.RejectCall` | `internal/http/routes.go:135` |
| `POST` | `/instance/{instance}/chat/edit-message` | Bearer da instância | `chatHandler.EditMessage` | `internal/http/routes.go:136` |
| `POST` | `/instance/{instance}/send/payment-request` | Bearer da instância | `messageHandler.SendPaymentRequest` | `internal/http/routes.go:140` |
| `POST` | `/instance/{instance}/send/review-order` | Bearer da instância | `messageHandler.ReviewOrder` | `internal/http/routes.go:141` |
| `POST` | `/instance/{instance}/send/pix` | Bearer da instância | `messageHandler.SendPix` | `internal/http/routes.go:142` |
| `POST` | `/instance/{instance}/send/text` | Bearer da instância | `messageHandler.SendText` | `internal/http/routes.go:143` |
| `POST` | `/instance/{instance}/send/link` | Bearer da instância | `messageHandler.SendLink` | `internal/http/routes.go:144` |
| `POST` | `/instance/{instance}/send/media` | Bearer da instância | `messageHandler.SendMedia` | `internal/http/routes.go:145` |
| `POST` | `/instance/{instance}/send/media-file` | Bearer da instância | `messageHandler.SendMediaFile` | `internal/http/routes.go:146` |
| `POST` | `/instance/{instance}/send/ppt` | Bearer da instância | `messageHandler.SendWhatsAppAudio` | `internal/http/routes.go:147` |
| `POST` | `/instance/{instance}/send/ppt-file` | Bearer da instância | `messageHandler.SendWhatsAppAudioFile` | `internal/http/routes.go:148` |
| `POST` | `/instance/{instance}/send/contact` | Bearer da instância | `messageHandler.SendContact` | `internal/http/routes.go:149` |
| `POST` | `/instance/{instance}/send/location` | Bearer da instância | `messageHandler.SendLocation` | `internal/http/routes.go:150` |
| `POST` | `/instance/{instance}/send/reaction` | Bearer da instância | `messageHandler.SendReaction` | `internal/http/routes.go:151` |
| `POST` | `/instance/{instance}/send/form` | Bearer da instância | `messageHandler.SendForm` | `internal/http/routes.go:152` |
| `POST` | `/instance/{instance}/send/{type}` | Bearer da instância | `messageHandler.SendInteractive` | `internal/http/routes.go:153` |
| `POST` | `/instance/{instance}/media/data` | Bearer da instância | `chatHandler.MediaData` | `internal/http/routes.go:157` |
| `POST` | `/instance/{instance}/media/uploads` | Bearer da instância | `mediaUploadHandler.Create` | `internal/http/routes.go:158` |
| `GET` | `/instance/{instance}/media/uploads` | Bearer da instância | `mediaUploadHandler.List` | `internal/http/routes.go:159` |
| `GET` | `/instance/{instance}/media/{id}/uploads` | Bearer da instância | `mediaUploadHandler.FindByID` | `internal/http/routes.go:160` |
| `DELETE` | `/instance/{instance}/media/{id}/uploads` | Bearer da instância | `mediaUploadHandler.Delete` | `internal/http/routes.go:161` |
| `POST` | `/instance/{instance}/group` | Bearer da instância | `groupHandler.Create` | `internal/http/routes.go:165` |
| `PUT` | `/instance/{instance}/group/update-picture` | Bearer da instância | `groupHandler.UpdatePicture` | `internal/http/routes.go:166` |
| `GET` | `/instance/{instance}/group/invitation-code` | Bearer da instância | `groupHandler.InviteCode` | `internal/http/routes.go:167` |
| `PUT` | `/instance/{instance}/group/revoke-invitation` | Bearer da instância | `groupHandler.RevokeInviteCode` | `internal/http/routes.go:168` |
| `PUT` | `/instance/{instance}/group/update-participants` | Bearer da instância | `groupHandler.UpdateParticipant` | `internal/http/routes.go:169` |
| `DELETE` | `/instance/{instance}/group/leave` | Bearer da instância | `groupHandler.Leave` | `internal/http/routes.go:170` |
| `PUT` | `/instance/{instance}/webhook` | Bearer da instância | `webhookHandler.Set` | `internal/http/routes.go:175` |
| `GET` | `/instance/{instance}/webhook` | Bearer da instância | `webhookHandler.Find` | `internal/http/routes.go:176` |
| `POST` | `/message/batches` | API key global | `batchHandler.Create` | `internal/http/message_batch_routes.go:17` |
| `GET` | `/message/batches` | API key global | `batchHandler.List` | `internal/http/message_batch_routes.go:18` |
| `GET` | `/message/batches/{batchId}` | API key global | `batchHandler.Find` | `internal/http/message_batch_routes.go:19` |
| `GET` | `/message/batches/{batchId}/items` | API key global | `batchHandler.ListItems` | `internal/http/message_batch_routes.go:20` |
| `GET` | `/message/batches/{batchId}/items/{itemId}` | API key global | `batchHandler.FindItem` | `internal/http/message_batch_routes.go:21` |
| `GET` | `/message/batches/{batchId}/attempts` | API key global | `batchHandler.ListAttempts` | `internal/http/message_batch_routes.go:22` |
| `POST` | `/message/batches/{batchId}/start` | API key global | `batchHandler.Start` | `internal/http/message_batch_routes.go:23` |
| `POST` | `/message/batches/{batchId}/pause` | API key global | `batchHandler.Pause` | `internal/http/message_batch_routes.go:24` |
| `POST` | `/message/batches/{batchId}/stop` | API key global | `batchHandler.Stop` | `internal/http/message_batch_routes.go:25` |

## Endpoints encontrados na especificação

| Método | Caminho | operationId | Estado |
| --- | --- | --- | --- |
| `GET` | `/health` | `getHealth` | Atual |
| `GET` | `/ready` | `getReadiness` | Atual |
| `GET` | `/instance` | `listInstances` | Atual |
| `POST` | `/instance` | `createInstance` | Atual |
| `GET` | `/instance/{instance}` | `getInstance` | Atual |
| `DELETE` | `/instance/{instance}` | `deleteInstance` | Atual |
| `GET` | `/instance/{instance}/connection/status` | `getConnectionStatus` | Atual |
| `GET` | `/instance/{instance}/connect` | `connectInstanceByQrGet` | Atual |
| `POST` | `/instance/{instance}/connect` | `connectInstanceByQrPost` | Atual |
| `GET` | `/instance/{instance}/connect/code/{phoneNumber}` | `connectInstanceByPairingCodePath` | Atual |
| `POST` | `/instance/{instance}/connect/code` | `connectInstanceByPairingCodeBody` | Atual |
| `POST` | `/instance/{instance}/connect/passkey/challenge` | `createPasskeyChallenge` | Atual |
| `POST` | `/instance/{instance}/connect/passkey/assertion` | `submitPasskeyAssertion` | Atual |
| `DELETE` | `/instance/{instance}/logout/{instanceName}` | `logoutInstance` | Atual |
| `POST` | `/instance/{instance}/chat/is-account` | `checkWhatsAppAccounts` | Atual |
| `PATCH` | `/instance/{instance}/chat/read-message` | `markMessagesRead` | Atual |
| `PUT` | `/instance/{instance}/chat/archive` | `archiveChat` | Atual |
| `DELETE` | `/instance/{instance}/chat/delete-message` | `deleteChatMessage` | Atual |
| `POST` | `/instance/{instance}/chat/profile-picture` | `getProfilePicture` | Atual |
| `POST` | `/instance/{instance}/chat/reject-call` | `rejectCall` | Atual |
| `POST` | `/instance/{instance}/chat/edit-message` | `editMessage` | Atual |
| `POST` | `/instance/{instance}/send/text` | `sendTextMessage` | Atual |
| `POST` | `/instance/{instance}/send/link` | `sendLinkMessage` | Atual |
| `POST` | `/instance/{instance}/send/media` | `sendMediaMessage` | Atual |
| `POST` | `/instance/{instance}/send/media-file` | `sendMediaFileMessage` | Atual |
| `POST` | `/instance/{instance}/send/ppt` | `sendPushToTalkMessage` | Atual |
| `POST` | `/instance/{instance}/send/ppt-file` | `sendPushToTalkFileMessage` | Atual |
| `POST` | `/instance/{instance}/send/contact` | `sendContactMessage` | Atual |
| `POST` | `/instance/{instance}/send/location` | `sendLocationMessage` | Atual |
| `POST` | `/instance/{instance}/send/reaction` | `sendReactionMessage` | Atual |
| `POST` | `/instance/{instance}/media/data` | `downloadMessageMedia` | Atual |
| `GET` | `/instance/{instance}/media/uploads` | `listMediaUploads` | Atual |
| `POST` | `/instance/{instance}/media/uploads` | `createMediaUpload` | Atual |
| `GET` | `/instance/{instance}/media/{id}/uploads` | `getMediaUpload` | Atual |
| `DELETE` | `/instance/{instance}/media/{id}/uploads` | `deleteMediaUpload` | Atual |
| `POST` | `/instance/{instance}/group` | `createGroup` | Atual |
| `PUT` | `/instance/{instance}/group/update-picture` | `updateGroupPicture` | Atual |
| `GET` | `/instance/{instance}/group/invitation-code` | `getGroupInviteCode` | Atual |
| `PUT` | `/instance/{instance}/group/revoke-invitation` | `revokeGroupInviteCode` | Atual |
| `PUT` | `/instance/{instance}/group/update-participants` | `updateGroupParticipants` | Atual |
| `DELETE` | `/instance/{instance}/group/leave` | `leaveGroup` | Atual |
| `GET` | `/instance/{instance}/webhook` | `getInstanceWebhook` | Atual |
| `PUT` | `/instance/{instance}/webhook` | `setInstanceWebhook` | Atual |
| `POST` | `/instance/{instance}/send/payment-request` | `sendPaymentRequest` | Pro |
| `POST` | `/instance/{instance}/send/review-order` | `reviewOrder` | Pro |
| `POST` | `/instance/{instance}/send/pix` | `sendPixMessage` | Pro |
| `POST` | `/instance/{instance}/send/form` | `sendFormMessage` | Pro |
| `POST` | `/instance/{instance}/send/{type}` | `sendInteractiveMessage` | Pro |
| `POST` | `/instance/create` | `legacyCreateInstance` | Legado |
| `GET` | `/instance/fetchInstances` | `legacyListInstances` | Legado |
| `GET` | `/instance/fetchInstance/{instanceName}` | `legacyGetInstance` | Legado |
| `PUT` | `/instance/refreshToken/{instanceName}` | `refreshInstanceToken` | Atual |
| `DELETE` | `/instance/delete/{instanceName}` | `legacyDeleteInstance` | Legado |
| `GET` | `/instance/connect/{instanceName}/code/{phoneNumber}` | `legacyConnectByPairingCodePath` | Legado |
| `POST` | `/instance/connect/{instanceName}/code` | `legacyConnectByPairingCodeBody` | Legado |
| `POST` | `/instance/connect/{instanceName}/passkey/challenge` | `legacyCreatePasskeyChallenge` | Legado |
| `POST` | `/instance/connect/{instanceName}/passkey/assertion` | `legacySubmitPasskeyAssertion` | Legado |
| `GET` | `/instance/connect/{instanceName}` | `legacyConnectByQrGet` | Legado |
| `POST` | `/instance/connect/{instanceName}` | `legacyConnectByQrPost` | Legado |
| `DELETE` | `/instance/logout/{instanceName}` | `legacyLogoutInstance` | Legado |
| `PUT` | `/webhook/set/{instanceName}` | `legacySetInstanceWebhook` | Legado |
| `GET` | `/webhook/find/{instanceName}` | `legacyGetInstanceWebhook` | Legado |
| `POST` | `/message/sendText/{instanceName}` | `legacySendTextMessage` | Legado |
| `POST` | `/message/sendLink/{instanceName}` | `legacySendLinkMessage` | Legado |
| `POST` | `/message/sendMedia/{instanceName}` | `legacySendMediaMessage` | Legado |
| `POST` | `/message/sendMediaFile/{instanceName}` | `legacySendMediaFileMessage` | Legado |
| `POST` | `/message/sendWhatsAppAudio/{instanceName}` | `legacySendPushToTalkMessage` | Legado |
| `POST` | `/message/sendWhatsAppAudioFile/{instanceName}` | `legacySendPushToTalkFileMessage` | Legado |
| `POST` | `/message/sendContact/{instanceName}` | `legacySendContactMessage` | Legado |
| `POST` | `/message/sendLocation/{instanceName}` | `legacySendLocationMessage` | Legado |
| `POST` | `/message/sendReaction/{instanceName}` | `legacySendReactionMessage` | Legado |
| `PATCH` | `/message/reviewOrder/{instanceName}` | `legacyReviewOrder` | Legado |
| `POST` | `/chat/whatsappNumbers/{instanceName}` | `legacyCheckWhatsAppAccounts` | Legado |
| `PATCH` | `/chat/readMessages/{instanceName}` | `legacyMarkMessagesRead` | Legado |
| `PUT` | `/chat/archiveChat/{instanceName}` | `legacyArchiveChat` | Legado |
| `POST` | `/chat/fetchProfilePictureUrl/{instanceName}` | `legacyGetProfilePicture` | Legado |
| `POST` | `/chat/rejectCall/{instanceName}` | `legacyRejectCall` | Legado |
| `POST` | `/chat/editMessage/{instanceName}` | `legacyEditMessage` | Legado |
| `POST` | `/chat/mediaData/{instanceName}` | `legacyDownloadMessageMedia` | Legado |
| `DELETE` | `/chat/deleteMessage/{instanceName}` | `legacyDeleteChatMessage` | Legado |
| `POST` | `/group/create/{instanceName}` | `legacyCreateGroup` | Legado |
| `PUT` | `/group/updateGroupPicture/{instanceName}` | `legacyUpdateGroupPicture` | Legado |
| `GET` | `/group/inviteCode/{instanceName}` | `legacyGetGroupInviteCode` | Legado |
| `PUT` | `/group/revokeInviteCode/{instanceName}` | `legacyRevokeGroupInviteCode` | Legado |
| `PUT` | `/group/updateParticipant/{instanceName}` | `legacyUpdateGroupParticipants` | Legado |
| `DELETE` | `/group/leaveGroup/{instanceName}` | `legacyLeaveGroup` | Legado |
| `GET` | `/message/batches` | `listMessageBatches` | Pro |
| `POST` | `/message/batches` | `createMessageBatch` | Pro |
| `GET` | `/message/batches/{batchId}` | `getMessageBatch` | Pro |
| `GET` | `/message/batches/{batchId}/items` | `listMessageBatchItems` | Pro |
| `GET` | `/message/batches/{batchId}/items/{itemId}` | `getMessageBatchItem` | Pro |
| `GET` | `/message/batches/{batchId}/attempts` | `listMessageBatchAttempts` | Pro |
| `POST` | `/message/batches/{batchId}/start` | `startMessageBatch` | Pro |
| `POST` | `/message/batches/{batchId}/pause` | `pauseMessageBatch` | Pro |
| `POST` | `/message/batches/{batchId}/stop` | `stopMessageBatch` | Pro |

## Endpoints adicionados à especificação

- `POST /instance/{instance}/send/review-order`, operationId `reviewOrder`.
- `PATCH /message/reviewOrder/{instanceName}`, operationId `legacyReviewOrder`, mantido como alias legado deprecated.

## Inconsistências corrigidas

- As duas rotas de revisão de pedido estavam registradas e testadas no runtime, descritas nos guias editoriais e comentadas ou ausentes no OpenAPI. Ambas passaram a fazer parte do contrato OpenAPI 3.1.
- A contagem da referência foi atualizada de 93 para 95 operações HTTP distintas.
- A busca e as URLs compartilháveis agora usam `operationId` em vez de links genéricos para tags.
- A interface deixou de depender visualmente do Scalar e passou a interpretar o OpenAPI diretamente.

## Divergências ainda observáveis no código

- Registro duplicado de `POST /instance/{instance}/connect/code` em `internal/http/routes.go:122`. A auditoria conta a operação uma única vez e não altera o handler.
- A rota atual `DELETE /instance/{instance}/logout/{instanceName}` mantém dois parâmetros de instância no caminho. O middleware autentica primeiro `instanceName`; a documentação preserva o contrato literal até uma decisão de compatibilidade.
- Não existe rota WebSocket, SSE ou upgrade HTTP no runtime auditado. Os guias de tempo real explicam que a integração disponível usa webhooks.
- A classificação Pro é documental: não há claim de plano, bloqueio de leitura ou resposta 402 no runtime atual.

## Endpoints possivelmente obsoletos

Os 37 endpoints abaixo continuam registrados, mas estão marcados como `deprecated` por possuírem substitutos atuais:

- `POST /instance/create` (`legacyCreateInstance`)
- `GET /instance/fetchInstances` (`legacyListInstances`)
- `GET /instance/fetchInstance/{instanceName}` (`legacyGetInstance`)
- `DELETE /instance/delete/{instanceName}` (`legacyDeleteInstance`)
- `GET /instance/connect/{instanceName}/code/{phoneNumber}` (`legacyConnectByPairingCodePath`)
- `POST /instance/connect/{instanceName}/code` (`legacyConnectByPairingCodeBody`)
- `POST /instance/connect/{instanceName}/passkey/challenge` (`legacyCreatePasskeyChallenge`)
- `POST /instance/connect/{instanceName}/passkey/assertion` (`legacySubmitPasskeyAssertion`)
- `GET /instance/connect/{instanceName}` (`legacyConnectByQrGet`)
- `POST /instance/connect/{instanceName}` (`legacyConnectByQrPost`)
- `DELETE /instance/logout/{instanceName}` (`legacyLogoutInstance`)
- `PUT /webhook/set/{instanceName}` (`legacySetInstanceWebhook`)
- `GET /webhook/find/{instanceName}` (`legacyGetInstanceWebhook`)
- `POST /message/sendText/{instanceName}` (`legacySendTextMessage`)
- `POST /message/sendLink/{instanceName}` (`legacySendLinkMessage`)
- `POST /message/sendMedia/{instanceName}` (`legacySendMediaMessage`)
- `POST /message/sendMediaFile/{instanceName}` (`legacySendMediaFileMessage`)
- `POST /message/sendWhatsAppAudio/{instanceName}` (`legacySendPushToTalkMessage`)
- `POST /message/sendWhatsAppAudioFile/{instanceName}` (`legacySendPushToTalkFileMessage`)
- `POST /message/sendContact/{instanceName}` (`legacySendContactMessage`)
- `POST /message/sendLocation/{instanceName}` (`legacySendLocationMessage`)
- `POST /message/sendReaction/{instanceName}` (`legacySendReactionMessage`)
- `PATCH /message/reviewOrder/{instanceName}` (`legacyReviewOrder`)
- `POST /chat/whatsappNumbers/{instanceName}` (`legacyCheckWhatsAppAccounts`)
- `PATCH /chat/readMessages/{instanceName}` (`legacyMarkMessagesRead`)
- `PUT /chat/archiveChat/{instanceName}` (`legacyArchiveChat`)
- `POST /chat/fetchProfilePictureUrl/{instanceName}` (`legacyGetProfilePicture`)
- `POST /chat/rejectCall/{instanceName}` (`legacyRejectCall`)
- `POST /chat/editMessage/{instanceName}` (`legacyEditMessage`)
- `POST /chat/mediaData/{instanceName}` (`legacyDownloadMessageMedia`)
- `DELETE /chat/deleteMessage/{instanceName}` (`legacyDeleteChatMessage`)
- `POST /group/create/{instanceName}` (`legacyCreateGroup`)
- `PUT /group/updateGroupPicture/{instanceName}` (`legacyUpdateGroupPicture`)
- `GET /group/inviteCode/{instanceName}` (`legacyGetGroupInviteCode`)
- `PUT /group/revokeInviteCode/{instanceName}` (`legacyRevokeGroupInviteCode`)
- `PUT /group/updateParticipant/{instanceName}` (`legacyUpdateGroupParticipants`)
- `DELETE /group/leaveGroup/{instanceName}` (`legacyLeaveGroup`)

## Schemas sem exemplos explícitos

88 schemas não possuem `example` explícito. A interface gera exemplos coerentes a partir de tipos, enums, formatos, defaults e contexto CodeChat, sem alterar o contrato:

- `MessageBatchStatus`
- `MessageBatchItemStatus`
- `MessageBatchAttemptStatus`
- `MessageBatchErrorResponse`
- `MessageBatchDelay`
- `MessageBatchDelayInput`
- `MessageBatchOptions`
- `MessageBatchOptionsInput`
- `MessageBatchMessage`
- `MessageBatchInteractivePayload`
- `MessageBatchCounts`
- `MessageBatchInstance`
- `MessageBatch`
- `MessageBatchAttempt`
- `MessageBatchItem`
- `MessageBatchItemDetail`
- `MessageBatchPage`
- `MessageBatchItemPage`
- `MessageBatchAttemptPage`
- `MessageBatchWebhookEvent`
- `MessageBatchWebhookCurrentItem`
- `MessageBatchLifecycleWebhookData`
- `MessageBatchItemWebhookData`
- `MessageBatchWebhookEnvelope`
- `InstanceAuth`
- `CreateInstanceAuth`
- `RefreshTokenResponse`
- `CreateInstanceResponse`
- `WebhookEvents`
- `Webhook`
- `InstanceListItem`
- `InstanceListResponse`
- `InstanceResponse`
- `DeleteInstanceResponse`
- `QRCodeResponse`
- `PasskeyChallengeResponse`
- `PasskeyAssertionRequest`
- `PasskeyAcceptedResponse`
- `ConnectionStatusResponse`
- `LogoutResponse`
- `MessageOptions`
- `PTTMessageOptions`
- `Message`
- `AcceptedResponse`
- `SendLinkRequest`
- `SendMediaRequest`
- `SendMediaFileRequest`
- `SendPTTFileRequest`
- `ContactItem`
- `SendContactRequest`
- `SendLocationRequest`
- `SendReactionRequest`
- `IsAccountRequest`
- `IsAccountResponse`
- `ReadMessagesRequest`
- `ReadMessagesResponse`
- `MessageKey`
- `ArchiveChatRequest`
- `RecipientRequest`
- `ProfilePictureResponse`
- `RejectCallRequest`
- `EditMessageRequest`
- `MediaDataRequest`
- `MediaDataEnvelope`
- `CreateMediaUploadRequest`
- `WhatsAppUpload`
- `MediaUpload`
- `MediaUploadList`
- `CreateGroupRequest`
- `UpdateGroupPictureRequest`
- `UpdateParticipantsRequest`
- `GroupParticipant`
- `GroupInfo`
- `InviteCodeResponse`
- `Amount`
- `Presentation`
- `PaymentSetting`
- `OrderItem`
- `PaymentOrder`
- `PaymentRequest`
- `ReviewOrderResult`
- `PixRequest`
- `FormRequest`
- `InteractiveButton`
- `ButtonMessage`
- `CarouselCard`
- `CarouselMessage`
- `InteractiveRequest`

## Rotas sem documentação suficiente

- Operações sem `summary` e sem `description`: 0.
- Operações sem exemplo explícito no nível da operação: 94. A referência prioriza exemplos explícitos de mídia/schema e usa o gerador de exemplos como fallback.
- Rotas presentes no código e ausentes no OpenAPI: 0.
- Nenhuma.
- Rotas presentes no OpenAPI e ausentes no código: 0.
- Nenhuma.

## Pontos dependentes de confirmação humana

- URL pública de produção, versão comercial exibida e link GitHub definitivo por ambiente.
- Política formal de versionamento, prazo de remoção dos aliases legados e eventual correção da rota de logout com dois parâmetros.
- Política oficial de rate limits; o runtime atual não registra limitador nem produz `429`.
- Eventual enforcement comercial dos recursos Pro; o runtime atual não produz `402`.
- Requisitos futuros de assinatura HMAC e retry para webhooks por instância; esses recursos não existem no emissor atual.

## Webhooks e WebSocket

- O código e o documento gerado confirmam 27 eventos por instância e 14 eventos globais de Message Batch.
- Eventos por instância usam fila em memória, timeout de 15 segundos, sucesso em 2xx e não possuem retry automático nem dead-letter queue.
- Eventos de Message Batch usam outbox PostgreSQL e retry persistente com backoff.
- Não há assinatura HMAC no emissor atual; `x-request-id` é correlação, não prova de autenticidade ou chave de idempotência.
- Não há suporte WebSocket/SSE implementado; nenhum protocolo ou endpoint foi inventado na nova referência.
