# Auditoria da referência de API

Gerado exclusivamente a partir da especificação versionada em `source-docs/openapi.yml`. A auditoria e o build não leem arquivos de outros repositórios.

## Resumo

| Item | Quantidade |
| --- | ---: |
| Operações HTTP no OpenAPI | 113 |
| Operações atuais, sem classificação Pro | 44 |
| Operações Pro | 30 |
| Operações marcadas como deprecated | 38 |
| Operações de webhook no OpenAPI | 1 |
| Schemas em components.schemas | 136 |
| Eventos de webhook por instância | 27 |
| Eventos globais de Message Batch | 18 |

Resultado: **a especificação local está estruturalmente consistente e sincronizada com a cópia publicada.**

## Validações executadas

- `source-docs/openapi.yml` existe dentro deste repositório e é a fonte canônica.
- `public/openapi.yml` é uma cópia idêntica à fonte canônica.
- Todos os endpoints e webhooks possuem `operationId` único, texto descritivo, tag e resposta.
- Todos os parâmetros de caminho estão declarados e marcados como obrigatórios.
- O relatório, o catálogo de webhooks, o índice de busca e a referência são derivados apenas dos arquivos versionados neste projeto.

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
| `POST` | `/instance/{instance}/db/messages` | `findPersistedMessages` | Atual |
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
| `POST` | `/chat/findMessages/{instanceName}` | `legacyFindMessages` | Legado |
| `DELETE` | `/chat/deleteMessage/{instanceName}` | `legacyDeleteChatMessage` | Legado |
| `POST` | `/group/create/{instanceName}` | `legacyCreateGroup` | Legado |
| `PUT` | `/group/updateGroupPicture/{instanceName}` | `legacyUpdateGroupPicture` | Legado |
| `GET` | `/group/inviteCode/{instanceName}` | `legacyGetGroupInviteCode` | Legado |
| `PUT` | `/group/revokeInviteCode/{instanceName}` | `legacyRevokeGroupInviteCode` | Legado |
| `PUT` | `/group/updateParticipant/{instanceName}` | `legacyUpdateGroupParticipants` | Legado |
| `DELETE` | `/group/leaveGroup/{instanceName}` | `legacyLeaveGroup` | Legado |
| `POST` | `/message/batches` | `createMessageBatch` | Pro |
| `POST` | `/message/batches/list` | `listMessageBatches` | Pro |
| `GET` | `/message/batches/{batchId}` | `getMessageBatch` | Pro |
| `GET` | `/message/batches/{batchId}/processing` | `getMessageBatchProcessing` | Pro |
| `GET` | `/message/batches/{batchId}/items` | `listMessageBatchItems` | Pro |
| `GET` | `/message/batches/{batchId}/items/{itemId}` | `getMessageBatchItem` | Pro |
| `GET` | `/message/batches/{batchId}/attempts` | `listMessageBatchAttempts` | Pro |
| `POST` | `/message/batches/{batchId}/start` | `startMessageBatch` | Pro |
| `POST` | `/message/batches/{batchId}/pause` | `pauseMessageBatch` | Pro |
| `POST` | `/message/batches/{batchId}/stop` | `stopMessageBatch` | Pro |
| `GET` | `/call/{instanceName}` | `listCalls` | Pro |
| `POST` | `/call/{instanceName}` | `startCall` | Pro |
| `GET` | `/call/{instanceName}/config` | `getInstanceCallSettings` | Pro |
| `PUT` | `/call/{instanceName}/config` | `updateInstanceCallSettings` | Pro |
| `GET` | `/call/{instanceName}/{callId}` | `getCall` | Pro |
| `GET` | `/call/{instanceName}/{callId}/events` | `listCallEvents` | Pro |
| `POST` | `/call/{instanceName}/{callId}/answer` | `answerCall` | Pro |
| `POST` | `/call/{instanceName}/{callId}/reject` | `rejectManagedCall` | Pro |
| `POST` | `/call/{instanceName}/{callId}/hangup` | `hangupCall` | Pro |
| `GET` | `/call/{instanceName}/{callId}/recordings` | `listCallRecordings` | Pro |
| `POST` | `/call/{instanceName}/{callId}/recording/start` | `startCallRecording` | Pro |
| `POST` | `/call/{instanceName}/{callId}/recording/stop` | `stopCallRecording` | Pro |
| `GET` | `/call/{instanceName}/{callId}/recordings/{recordingId}` | `getCallRecording` | Pro |
| `DELETE` | `/call/{instanceName}/{callId}/recordings/{recordingId}` | `deleteCallRecording` | Pro |
| `GET` | `/call/{instanceName}/{callId}/recordings/{recordingId}/download` | `downloadCallRecording` | Pro |

## Endpoints possivelmente obsoletos

Os 38 endpoints abaixo continuam documentados, mas estão marcados como `deprecated` por possuírem substitutos atuais:

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
- `POST /chat/findMessages/{instanceName}` (`legacyFindMessages`)
- `DELETE /chat/deleteMessage/{instanceName}` (`legacyDeleteChatMessage`)
- `POST /group/create/{instanceName}` (`legacyCreateGroup`)
- `PUT /group/updateGroupPicture/{instanceName}` (`legacyUpdateGroupPicture`)
- `GET /group/inviteCode/{instanceName}` (`legacyGetGroupInviteCode`)
- `PUT /group/revokeInviteCode/{instanceName}` (`legacyRevokeGroupInviteCode`)
- `PUT /group/updateParticipant/{instanceName}` (`legacyUpdateGroupParticipants`)
- `DELETE /group/leaveGroup/{instanceName}` (`legacyLeaveGroup`)

## Schemas sem exemplos explícitos

122 schemas não possuem `example` explícito. A interface gera exemplos a partir de tipos, enums, formatos, defaults e contexto da CodeChat:

- `CallStatus`
- `AnsweredBy`
- `EndedBy`
- `AnswerRequestedBy`
- `StartCallRequest`
- `CallReasonRequest`
- `Call`
- `CallEvent`
- `RecordingStatus`
- `CallRecording`
- `StartCallRecordingRequest`
- `StopCallRecordingRequest`
- `InstanceCallSettings`
- `EffectiveCallSettings`
- `UpdateInstanceCallSettingsRequest`
- `InstanceCallSettingsResponse`
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
- `MessageBatchSchedule`
- `MessageBatchScheduleInput`
- `MessageBatchCounts`
- `MessageBatchInstance`
- `MessageBatch`
- `MessageBatchAttempt`
- `MessageBatchItem`
- `MessageBatchItemDetail`
- `MessageBatchProcessingRecipient`
- `MessageBatchProcessing`
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
- `NativeFlowMessage`
- `SendNativeFlowRequest`
- `IsAccountRequest`
- `IsAccountResponse`
- `ReadMessagesRequest`
- `ReadMessagesResponse`
- `FindMessagesRequest`
- `FindMessagesFilter`
- `MessageCursorRequest`
- `MessageCursor`
- `FindMessagesResponse`
- `FindMessagesPage`
- `FindMessagesPageInfo`
- `PersistedMessageUpdate`
- `PersistedMessage`
- `LegacyFindMessagesRequest`
- `LegacyMessage`
- `LegacyFindMessagesResponse`
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

## Cobertura editorial

- Operações sem `summary` e sem `description`: 0.
- Operações sem tag: 0.
- Operações sem resposta: 0.
- Operações sem exemplo explícito no nível da operação: 112. A referência prioriza exemplos de mídia/schema e usa o gerador como fallback.
- Parâmetros de caminho inconsistentes: 0.
- `operationId` ausente ou duplicado: 0.

## Escopo da auditoria

Esta verificação garante a consistência da documentação autocontida. A comparação com handlers, middlewares e rotas do runtime deve ser feita no momento em que os arquivos de `source-docs` forem atualizados; o deploy deste portal não depende do checkout do código Go.

## Inconsistências encontradas

- Nenhum.
