# Finanças API

API Laravel 12 para o aplicativo de finanças pessoais. Usa MySQL/MariaDB e Laravel Sanctum com Bearer tokens.

## Requisitos

- PHP 8.2+
- Composer 2
- MySQL 8+ ou MariaDB 10.6+
- Extensões PHP: `pdo_mysql`, `mbstring`, `openssl`, `xml`, `ctype`, `json`, `tokenizer`

## Instalação local

PHP 8.2
```
composer update -vvv
```

PHP 8.4
```bash
composer install
cp .env.example .env
php artisan key:generate
```

No Windows PowerShell, use `Copy-Item .env.example .env`.

Crie o banco e configure o `.env`:

```sql
CREATE DATABASE finora_br CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

```env
DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=finora_br
DB_USERNAME=root
DB_PASSWORD=sua_senha
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

Depois:

```bash
php artisan migrate
php artisan test
php artisan serve
```

A API ficará em `http://localhost:8000/api`.

## Autenticação

`POST /api/register` e `POST /api/login` retornam `plain_text_token`. Envie-o nas próximas chamadas:

```http
Authorization: Bearer SEU_TOKEN
Accept: application/json
```

## Recursos

- `GET|POST /api/payment-methods`
- `GET|PATCH|DELETE /api/payment-methods/{paymentMethod}`
- `GET|POST /api/expenses`
- `GET|PATCH|DELETE /api/expenses/{expense}`
- `GET /api/invoices`
- `GET /api/invoices/{invoice}`
- `POST /api/invoices/{invoice}/pay`

## Regras de fatura

- Todo método de pagamento ativo pode ser usado em crédito, débito, depósito, transferência ou pagamento de fatura.
- Uma compra de crédito vai, por padrão, para a fatura do próximo mês-calendário em relação à data da compra.
- Uma referência de fatura pode ter vários ciclos: ao quitar uma fatura, a próxima compra do mesmo período abre um novo ciclo, separado do total já pago.
- Uma compra de crédito pode ser atribuída a outra fatura aberta do mesmo cartão.
- Faturas pagas e compras nelas vinculadas não podem ser editadas ou removidas.
- O pagamento da fatura é atômico: registra a transação, atualiza o saldo do método pagador e fecha a fatura.

## Publicação em hospedagem compartilhada

1. Gere `vendor` localmente com `composer install --no-dev --optimize-autoloader`.
2. Envie o projeto inteiro para uma pasta fora de `public_html`.
3. Faça o domínio/subdomínio apontar para `backend/public`.
4. Crie `.env` de produção com `APP_ENV=production`, `APP_DEBUG=false`, credenciais reais do banco e a origem real do frontend em `CORS_ALLOWED_ORIGINS`.
5. Garanta escrita em `storage` e `bootstrap/cache`.
6. Execute `php artisan migrate --force`, `php artisan config:cache` e `php artisan route:cache` por SSH. Se o plano não oferecer SSH, execute as migrations em cópia local e siga o guia em `../../docs/migracao-banco-legado.md` para importar o banco pelo phpMyAdmin.

Não exponha `.env`, `vendor`, `app` ou `routes` dentro de `public_html`.
