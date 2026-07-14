# Contratos para Postman

Defina `{{baseUrl}}` como `http://localhost:8000/api`. Para chamadas autenticadas, envie:

```http
Accept: application/json
Authorization: Bearer {{token}}
```

## Cadastro e login

`POST {{baseUrl}}/register`

```json
{
  "username": "rennan_financas",
  "email": "rennan@example.com",
  "password": "SenhaForte@12345",
  "password_confirmation": "SenhaForte@12345"
}
```

`POST {{baseUrl}}/login`

```json
{
  "email": "rennan@example.com",
  "password": "SenhaForte@12345",
  "device_name": "postman"
}
```

Copie `data.token.plain_text_token` para a variável `token`.

## Criar método de pagamento

`POST {{baseUrl}}/payment-methods`

```json
{
  "name": "Nubank",
  "balance": 0,
  "is_favorite": true
}
```

Todo método pode ser usado em crédito, débito, depósito, transferência e pagamento de fatura. Só um método por usuário pode ser favorito.

## Criar compra no crédito

`POST {{baseUrl}}/expenses`

```json
{
  "description": "Mercado",
  "amount": 250.75,
  "transaction_date": "2026-07-13",
  "type": "credit",
  "payment_method_id": 1
}
```

Resposta `201`: a compra retornará em `data.invoice`. Neste exemplo, `reference_month` será `8` e `reference_year` será `2026`.
Se a fatura `08/2026` já tiver sido paga, a API abrirá um novo `cycle` para `08/2026`; o valor dessa nova compra não é somado à fatura quitada.

## Mover compra para outra fatura

Primeiro consulte as faturas abertas:

```http
GET {{baseUrl}}/invoices?payment_method_id=1&status=open
```

Depois:

```http
PATCH {{baseUrl}}/expenses/1
```

```json
{
  "invoice_id": 2
}
```

A fatura deve estar aberta, pertencer ao usuário e usar o mesmo cartão da compra.

## Criar débito, depósito ou transferência

Débito:

```json
{
  "description": "Almoço",
  "amount": 35,
  "transaction_date": "2026-07-13",
  "type": "debit",
  "payment_method_id": 2
}
```

Depósito:

```json
{
  "description": "Salário",
  "amount": 3000,
  "transaction_date": "2026-07-13",
  "type": "deposit",
  "payment_method_id": 3
}
```

Transferência:

```json
{
  "description": "Reserva",
  "amount": 100,
  "transaction_date": "2026-07-13",
  "type": "transfer",
  "payment_method_id": 2,
  "destination_payment_method_id": 3
}
```

## Pagar fatura

`POST {{baseUrl}}/invoices/2/pay`

```json
{
  "payment_method_id": 2,
  "transaction_date": "2026-08-10"
}
```

O endpoint só aceita fatura aberta. Qualquer método ativo do usuário pode efetuar o pagamento. Uma segunda tentativa retorna `422`, sem debitar novamente.

## Erros esperados

- `401`: token ausente ou inválido.
- `403/404`: recurso de outro usuário.
- `422`: validação, método incompatível, fatura paga ou tentativa repetida de pagamento.
- `429`: excesso de tentativas em login/cadastro ou pagamento de fatura.
