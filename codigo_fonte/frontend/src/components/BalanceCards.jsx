import React, { useMemo } from "react";
import { CreditCard, Wallet } from "lucide-react";

/**
 * Cartões/contas com o dinheiro disponível + resumo do mês.
 * No mobile a aba Compras mostra apenas o saldo disponível (contas em lista
 * vertical); os cards de resumo aparecem a partir de md.
 */
function BalanceCards({ dashboard, summary, selectedMonth, onSelectMethod }) {
  const nextInvoiceReference = useMemo(
    () => new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1),
    [selectedMonth]
  );

  const openInvoiceTotal = useMemo(
    () => dashboard.invoices
      .filter((invoice) =>
        invoice.status === "open" &&
        invoice.reference_month === nextInvoiceReference.getMonth() + 1 &&
        invoice.reference_year === nextInvoiceReference.getFullYear()
      )
      .reduce((total, invoice) => total + Number(invoice.total_amount), 0),
    [dashboard.invoices, nextInvoiceReference]
  );

  const openInvoiceLabel = `Fatura aberta — ${String(nextInvoiceReference.getMonth() + 1).padStart(2, "0")}/${nextInvoiceReference.getFullYear()}`;

  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-xl border bg-card p-4 md:p-5">
        <p className="text-sm text-muted-foreground">Saldo disponível</p>
        <p className="mt-1 text-3xl font-bold text-primary">R$ {Number(dashboard.balance).toFixed(2)}</p>

        {dashboard.payment_methods.length === 0 ? (
          <p className="mt-5 text-sm text-muted-foreground">
            Nenhum cartão ou conta cadastrado. Adicione um em “Novo Cartão/Conta”.
          </p>
        ) : (
          <div className="mt-5 flex max-h-[400px] flex-col gap-2 overflow-y-auto">
            {dashboard.payment_methods.map((method) => (
              <button
                key={method.id}
                type="button"
                onClick={() => onSelectMethod?.(method)}
                className="flex w-full items-center justify-between gap-2 rounded-lg bg-muted/50 p-3 text-left hover:bg-muted"
              >
                <span className="flex min-w-0 items-center gap-2 text-sm">
                  <Wallet className="h-4 w-4 shrink-0" />
                  <span className="truncate">{method.name}</span>
                </span>
                <span className="shrink-0 font-semibold">R$ {Number(method.balance).toFixed(2)}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="hidden h-full flex-col gap-3 md:flex">
        <SummaryCard label={openInvoiceLabel} value={openInvoiceTotal} icon={<CreditCard className="h-5 w-5" />} className="flex-1" />
        <SummaryCard label="Débito e boletos" value={summary.debit} icon={<Wallet className="h-5 w-5" />} className="flex-1" />
        <SummaryCard label="Depósitos" value={summary.deposit} icon={<Wallet className="h-5 w-5" />} className="flex-1" />
      </div>
    </section>
  );
}

function SummaryCard({ label, value, icon, className }) {
  return (
    <div className={`rounded-xl border bg-muted/40 p-4 ${className || ""}`}>
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        {label} {icon}
      </div>
      <p className="mt-2 text-xl font-bold">R$ {Number(value).toFixed(2)}</p>
    </div>
  );
}

export default BalanceCards;
