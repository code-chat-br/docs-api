# CodeChat API Go Pro

Esta seção separa recursos comercialmente classificados como Pro. A classificação não é aplicada pelo runtime atual: não há claim de plano e nenhuma rota retorna `402`. As rotas por instância exigem o JWT da instância; `/message/batches...` usa JWT de usuário com `userId` em formato UUID. No OpenAPI, isso aparece como `x-codechat-plan: pro` e `x-codechat-plan-enforced: false`.

## Matriz

| Método | Rota | Recurso | Sucesso |
| --- | --- | --- | --- |
| `POST` | `/instance/:instance/send/payment-request` | Solicitação de pagamento/pedido | `200` |
| `POST` | `/instance/:instance/send/review-order` | Atualização de pedido | `200` |
| `POST` | `/instance/:instance/send/pix` | PIX | `200` |
| `POST` | `/instance/:instance/send/form` | Formulário nativo | `200` |
| `POST` | `/instance/:instance/send/:type` | Interativo dinâmico | `200` |
| `POST/GET` | `/message/batches...` | Envio em lote persistente, incluindo listagem e resumo completo em `GET /message/batches/{batchId}/processing` | `200`/`201` |
| `POST/GET/PUT/DELETE` | `/call...` | Chamadas WhatsApp experimentais, incluindo configuração, controle, eventos e gravações | `200`/`201`/`202`/`204` |

A rota dinâmica é registrada depois das rotas explícitas. Assim, `payment-request`, `review-order`, `pix`, `form`, `text`, `link`, `media`, `media-file`, `ppt`, `ppt-file`, `contact`, `location` e `reaction` não são capturados como `:type`.

## Message Batch

Todas as operacoes sob `/message/batches` sao recursos Pro, incluindo criacao, listagem, consulta de lote, processamento completo, itens e tentativas, alem de `start`, `pause` e `stop`. Elas exigem `Authorization: Bearer <jwt-do-usuario>`; `apikey`, `x-api-key` e `apiKey` nao autenticam esse fluxo.

O JWT de usuario precisa conter `userId` em formato UUID e `exp`. A expiracao sempre e validada. A classificacao e apenas documental no runtime atual e nao altera respostas nem adiciona `402`. Consulte [Envio em lote](./message-batches.md) para arquitetura, estados, payloads, recovery e webhooks.

## Chamadas

Todas as operacoes sob `/call` sao recursos Pro, incluindo inicio de chamada, listagem, configuracao por instancia, consulta de chamada, eventos, atendimento, rejeicao, encerramento, reacoes, video e gravacoes. Elas exigem `Authorization: Bearer <jwt-da-instancia>`; `apikey`, `x-api-key`, `apiKey` e JWT de usuario nao autenticam esse fluxo.

A classificacao e apenas documental no runtime atual e nao altera respostas nem adiciona `402`. Consulte [Chamadas](./calls.md) para arquitetura, flags globais, configuracao por instancia, comportamento multi-device, gravacao e eventos.

## Solicitação de pagamento

```json
{
  "number":"5511999999999",
  "paymentRequestMessage":{
    "presentation":{"title":"Pedido #123","description":"Confirme o pagamento","footer":"CodeChat"},
    "referenceId":"pedido-123",
    "type":"physical-goods",
    "paymentType":"br",
    "currency":"BRL",
    "paymentSettings":[
      {"type":"pix_dynamic_code","pixDynamicCode":{"keyType":"EVP","code":"000201...","merchantName":"CodeChat"}}
    ],
    "totalAmount":{"value":10990,"offset":100},
    "order":{
      "status":"payment_requested",
      "items":[{"retailerId":"sku-1","name":"Produto","amount":{"value":9990,"offset":100},"quantity":1}],
      "subtotal":{"value":9990,"offset":100},
      "tax":{"value":0,"offset":100},
      "shipping":{"value":1000,"offset":100},
      "discount":{"value":0,"offset":100}
    }
  }
}
```

Regras principais:

- `presentation.description` é obrigatória; título e footer são opcionais.
- `type`, `paymentType` e `currency` são exatamente `physical-goods`, `br` e `BRL`.
- `paymentSettings` aceita 1 a 3 tipos únicos: `boleto`, `pix_dynamic_code` ou `payment_link`; cada item usa somente a configuração correspondente.
- Linha digitável de boleto contém 44 a 48 dígitos.
- PIX dinâmico aceita chave `CPF`, `CNPJ`, `EVP`, `EMAIL` ou `PHONE`.
- Valores são inteiros positivos com `offset > 0`; offsets precisam coincidir.
- O pedido contém de 1 a 100 itens e status `payment_requested`.
- `subtotal` precisa ser a soma dos itens e `totalAmount = subtotal + tax + shipping - discount`.
- `mediaUploadId` opcional precisa apontar para upload `image`, `video` ou `document` da mesma instância.

## Revisar pedido

```json
{
  "messageId":101,
  "status":"shipped",
  "note":"Enviado pela transportadora"
}
```

O body é estrito. `messageId` é inteiro positivo; `status` aceita `preparing_to_ship`, `shipped`, `delivered`, `completed` ou `canceled`; `note` aceita até 4096 caracteres. Respostas adicionais: `404` para pedido ausente, `409` para repetição/transição terminal, `422` para mensagem que não representa pedido ou pedido em grupo e `503` para sessão indisponível.

O sucesso retorna `messageId` (ID WhatsApp da atualização), `databaseMessageId`, `orderMessageId`, `referenceId`, `previousStatus`, `status`, `chatJid` e `timestamp`.

O alias legado `PATCH /message/reviewOrder/:instanceName` usa o mesmo handler, body e regras; a única diferença é método/caminho.

## PIX

```json
{
  "number":"5511999999999",
  "pixMessage":{
    "presentation":{"title":"Pagamento","description":"Pague via PIX","footer":"CodeChat"},
    "keyType":"EVP",
    "key":"123e4567-e89b-12d3-a456-426614174000",
    "merchantName":"CodeChat",
    "referenceId":"pedido-123"
  }
}
```

`presentation.description`, `keyType`, `key` e `merchantName` são obrigatórios. `keyType` aceita `CPF`, `CNPJ`, `EVP`, `EMAIL` ou `PHONE`; chave e merchant aceitam até 4096 e 255 caracteres. `referenceId` é opcional e, se omitido, é gerado. `mediaUploadId` segue as mesmas regras do pagamento.

## Formulário

```json
{
  "number":"5511999999999",
  "formMessage":{
    "formId":"lead-2026",
    "description":"Preencha seus dados",
    "buttonText":"Abrir formulário",
    "footerText":"CodeChat",
    "innerForm":{
      "title":"Contato",
      "description":"Dados para retorno",
      "enableName":true,
      "enableEmail":true
    }
  }
}
```

`formId`, `description`, `buttonText` e `innerForm` são obrigatórios. Limites: 255, 4096 e 256 caracteres para os três primeiros; `footerText` aceita 1024. O objeto `innerForm` é obrigatório, mas seus campos internos podem manter os valores zero/default. Formulário não aceita mídia nem `mentionAll`.

## Interativos dinâmicos

Tipos confirmados no código: `reply`, `copy`, `url`, `buttons` e `carousel`.

### Botões simples

```json
{
  "number":"5511999999999",
  "buttonMessage":{
    "title":"Escolha",
    "description":"Como deseja continuar?",
    "footer":"CodeChat",
    "mediaUploadId":42,
    "buttons":[
      {"type":"reply","displayText":"Falar agora","id":"talk"},
      {"type":"copy","displayText":"Copiar cupom","copyCode":"CODECHAT"},
      {"type":"url","displayText":"Abrir site","url":"https://codechat.dev"}
    ]
  }
}
```

Para `reply`, `copy` e `url`, o botão precisa do campo correspondente. Em `buttons`, cada item pode declarar `type`; sem ele, o tipo é inferido de `id`, `copyCode` ou `url`. `value` pode substituir o campo específico quando o tipo é explícito. Payloads duplicados são rejeitados.

`description` é obrigatória; há de 1 a 10 botões. Título/footer aceitam 1024 caracteres, descrição 4096, texto do botão 256 e payload 4096. `mediaUploadId` aceita número ou string numérica; `0`, string vazia ou ausência significam sem anexo. Somente uploads positivos `image`, `video` ou `document` são anexáveis.

### Carrossel

```json
{
  "number":"5511999999999",
  "carouselMessage":{
    "title":"Catálogo",
    "description":"Escolha um produto",
    "cards":[
      {
        "description":"Produto A",
        "mediaUploadId":42,
        "buttons":[{"type":"reply","displayText":"Comprar","id":"buy-a"}]
      }
    ]
  }
}
```

O carrossel aceita de 1 a 10 cards; cada card exige descrição e de 1 a 10 botões. O upload fica no card. `mediaUploadId` na raiz é rejeitado.

Todos os interativos rejeitam `mentionAll`. Consulte [Mensagens](./messages.md) para destinatários e opções compartilhadas.
