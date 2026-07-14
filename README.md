# Finora Br

Aplicação web para registrar depósitos, débitos, boletos, transferências, compras no crédito e faturas mensais.

## Estrutura

- `codigo_fonte/frontend`: React + Vite.
- `codigo_fonte/backend`: Laravel 12 API + Sanctum.
- `docs/migracao-banco-legado.md`: processo seguro para importar dados do sistema PHP antigo.

## Regras principais

- Compras no crédito vão para a fatura do próximo mês-calendário.
- Ao pagar uma fatura, novas compras do mesmo período iniciam um novo ciclo aberto e não alteram o total já quitado.
- Uma compra de crédito pode ser movida para outra fatura aberta do mesmo cartão.
- O pagamento fecha a fatura e debita o método selecionado de modo atômico.
- Todo método de pagamento pode ser usado em qualquer tipo de transação e um favorito global é pré-selecionado nos formulários.
- Novas transações começam com a data local atual.

## Desenvolvimento

Backend:

```bash
cd codigo_fonte/backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve
```

Frontend:

```bash
cd codigo_fonte/frontend
cp .env.example .env
npm install
npm run dev
```

O frontend usa `VITE_API_URL=http://localhost:8000/api` por padrão. Consulte `codigo_fonte/backend/README.md` para configuração do MySQL, rotas, segurança e publicação em hospedagem compartilhada.
