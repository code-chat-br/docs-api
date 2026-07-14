# Documentação da CodeChat API

Esta pasta descreve o contrato observado no código executável atual. A referência de máquina é o [OpenAPI 3.1](./openapi.yml); os guias abaixo explicam autenticação, validações, respostas e particularidades operacionais.

## Comece aqui

1. [Autenticação](./authentication.md): token global, token da instância, token de usuário e regras de correspondência.
2. [Instâncias](./instances.md): criação, listagem, consulta, rotação de token e exclusão.
3. [Conexões](./connections.md): QR Code, pairing code, passkey, estado e logout.
4. [Mensagens](./messages.md): mensagens comuns, fila assíncrona e opções compartilhadas.
5. [Envio em lote](./message-batches.md): recurso Pro com fila persistente, múltiplas instâncias, recovery e progresso.
6. [Chats](./chats.md): conta WhatsApp, leitura, arquivo, edição e exclusão.
7. [Mídia](./media.md): download de mídia e upload antecipado.
8. [Grupos](./groups.md): criação, participantes, convite, foto e saída.
9. [Webhooks](./webhooks.md): configuração, eventos, envelopes e entrega.
10. [WebSocket](./websocket.md): eventos em tempo real por instancia e por dono de lote.

## CodeChat API Go Pro

- [Endpoints Pro](./pro-endpoints.md): pagamento, PIX, revisão de pedido, formulário, mensagens interativas e Message Batch.

`Pro` é uma classificação comercial solicitada para a documentação. O código auditado não possui claim, middleware, tabela ou feature flag de plano e não retorna `402 Payment Required`. Os recursos Pro por instância usam o JWT da instância; Message Batch usa JWT de usuário com `userId` em formato UUID. O OpenAPI registra `x-codechat-plan: pro` e `x-codechat-plan-enforced: false` para não confundir classificação com bloqueio executável.

## Compatibilidade

- [Endpoints legados](./legacy-endpoints.md): aliases antigos ainda ativos e seus substitutos atuais.
- [Erros](./errors.md): envelope real, códigos HTTP e inconsistências conhecidas.
- [Variáveis de ambiente](./environment.md).
- [Pareamento por Passkey](./passkey-pairing.md).
- [Migrações](./migrations.md).

## Convenções

- A base URL local padrão é `http://localhost:8084`.
- Nas rotas atuais, `{instance}` é o nome público da instância.
- Nas rotas legadas, `{instanceName}` tem a mesma finalidade.
- Parâmetros são mostrados com chaves no OpenAPI e com `:param` em exemplos de rotas.
- Campos JSON desconhecidos são rejeitados nos handlers que usam decodificação estrita; as exceções estão destacadas nos guias.
- Endpoints legados só usam `deprecated: true` no OpenAPI quando existe substituto atual equivalente.
