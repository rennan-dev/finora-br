# Migração segura do banco PHP legado para Laravel

Este guia trata o banco atual como fonte de dados. Não execute `php artisan migrate:fresh`, `DROP DATABASE` ou os comandos de importação diretamente no banco de produção sem antes validar uma cópia.

## 1. Fazer backup e criar ambiente de ensaio

No phpMyAdmin do servidor atual:

1. Exporte o banco inteiro como SQL, com estrutura e dados.
2. Guarde o arquivo sem alterar e teste a restauração em outro banco.
3. Crie dois bancos locais ou de staging:
   - `financas_legacy`: importação do backup antigo;
   - `financas_laravel`: destino novo.
4. Configure o Laravel para `financas_laravel` e rode:

```bash
php artisan migrate
```

5. Só continue se `php artisan test` passar e se você conseguir acessar o banco de staging.

## 2. Diferenças que exigem decisão humana

A conversão não deve ser feita por cópia de tabela, pois o schema mudou.

- `users.name` passou a ser `users.username`. Revise espaços, acentos e duplicidades antes de importar.
- Métodos de pagamento não possuem classificação fixa: cada um pode ser usado em qualquer tipo de transação.
- O banco antigo não tem a tabela `invoices`; compras de crédito precisam ganhar uma fatura de referência.
- A tabela legada pode conter `money`, `boleto`, `transfer` e registros de pagamento de fatura. Mapeie esses tipos antes de importar.
- O código antigo usava uma tabela `installments` que não está no script oficial. Verifique se ela existe de fato no seu backup antes de decidir como tratar parcelamentos.

Monte uma planilha de conferência com `id`, nome do método e se ele será o favorito. Existe apenas um favorito global por usuário no novo sistema.

## 3. Importar usuários e métodos

Faça a importação apenas no banco de staging. Preserve os IDs antigos para manter os relacionamentos, quando possível.

Exemplo conceitual para usuários:

```sql
INSERT INTO financas_laravel.users (id, username, email, password, created_at, updated_at)
SELECT
  id,
  LOWER(REPLACE(TRIM(name), ' ', '_')),
  LOWER(TRIM(email)),
  password,
  COALESCE(created_at, NOW()),
  COALESCE(created_at, NOW())
FROM financas_legacy.users;
```

Antes de executar, confira usernames repetidos:

```sql
SELECT LOWER(REPLACE(TRIM(name), ' ', '_')) AS username, COUNT(*) AS total
FROM financas_legacy.users
GROUP BY username
HAVING total > 1;
```

Resolva as duplicidades manualmente antes do `INSERT`. Para métodos, use uma tabela de mapeamento temporária preenchida por você:

```sql
CREATE TABLE financas_laravel.legacy_method_map (
  legacy_method_id BIGINT PRIMARY KEY,
  is_favorite BOOLEAN NOT NULL DEFAULT FALSE
);
```

Preencha essa tabela e só então importe `payment_methods` fazendo `JOIN` pelo ID antigo. Não defina dois favoritos para o mesmo usuário.

## 4. Converter faturas e compras de crédito

No novo modelo, uma compra no crédito de julho pertence inicialmente à fatura de agosto. Para cada despesa legada com `payment_type = 'credit'`:

1. Calcule a referência como a data da compra acrescida de um mês-calendário.
2. Crie ou reutilize uma linha em `invoices` para o mesmo usuário, cartão, mês e ano.
3. Insira a despesa em `expenses` com `type = 'credit'`, `transaction_date` igual à data original e `invoice_id` igual à fatura criada.
4. Se a compra legada estiver marcada como paga, marque a fatura como `paid` somente depois de conferir que **todas** as compras daquela fatura foram quitadas.

Não há como deduzir com segurança o método pagador de todas as faturas antigas a partir do schema legado. Quando esse dado não puder ser confirmado, importe a fatura como paga sem preencher `paid_from_payment_method_id` e registre a decisão na planilha de auditoria.

## 5. Converter os demais lançamentos

- `debit` e `boleto`: insira em `expenses` com o mesmo tipo e método de pagamento.
- `deposit`: insira como `deposit`.
- `transfer`: preencha método de origem em `payment_method_id` e destino em `destination_payment_method_id`.
- `invoice_payment`: use apenas como histórico, depois de vincular a fatura correspondente. Não execute a lógica da API para esses dados antigos, pois ela alteraria saldos novamente.

Importe valores de saldo com cuidado: escolha uma única fonte de verdade.

- Se os saldos atuais de `payment_methods.balance` já foram conferidos, importe-os como saldo inicial e **não** reaplique transações antigas.
- Se deseja reconstruir saldos a partir de todas as transações, importe os métodos com saldo zero e recalcule em um script de staging. Não misture os dois métodos.

## 6. Validação antes do corte

Compare origem e destino no staging:

```sql
SELECT COUNT(*) FROM financas_legacy.users;
SELECT COUNT(*) FROM financas_laravel.users;

SELECT COUNT(*) FROM financas_legacy.payment_methods;
SELECT COUNT(*) FROM financas_laravel.payment_methods;

SELECT payment_type, COUNT(*), SUM(amount)
FROM financas_legacy.expenses
GROUP BY payment_type;

SELECT type, COUNT(*), SUM(amount)
FROM financas_laravel.expenses
GROUP BY type;
```

Também confira:

1. Cada compra de crédito tem `invoice_id`.
2. Cada fatura possui método de pagamento pertencente ao mesmo usuário.
3. Não existe mais de um favorito por usuário.
4. Faturas pagas não possuem compras pendentes.
5. Os saldos exibidos pela aplicação batem com a planilha de reconciliação.

## 7. Corte para produção

1. Coloque a aplicação antiga em manutenção para não receber novas transações.
2. Faça um backup final do MySQL.
3. Repita a migração testada em staging no banco de produção novo.
4. Configure o `.env` do Laravel, rode `php artisan migrate --force` antes da importação e valide as contagens.
5. Publique o frontend apontando `VITE_API_URL` para a URL `/api` do Laravel.
6. Mantenha o backup do banco antigo por um período de retenção definido por você.

Se seu plano Hostinger não oferece SSH, execute a preparação e os testes localmente, gere os arquivos SQL validados e importe-os pelo phpMyAdmin. Nunca importe um SQL não testado diretamente no banco em uso.
