import React, { useMemo } from "react";
import { CreditCard, Wallet } from "lucide-react";

/**
 * Cartões/contas com o dinheiro disponível + resumo do mês.
 * No mobile os cartões aparecem em um carrossel horizontal.
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
      <div className="rounded-xl border bg-card p-5">
        <p className="text-sm text-muted-foreground">Saldo disponível</p>
        <p className="mt-1 text-3xl font-bold text-primary">R$ {Number(dashboard.balance).toFixed(2)}</p>

        {dashboard.payment_methods.length === 0 ? (
          <p className="mt-5 text-sm text-muted-foreground">
            Nenhum cartão ou conta cadastrado. Adicione um em “Novo Cartão/Conta”.
          </p>
        ) : (
          <div className="mt-5 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 md:max-h-[400px] md:flex-col md:gap-2 md:overflow-y-auto md:pb-0">
            {dashboard.payment_methods.map((method) => (
              <button
                key={method.id}
                type="button"
                onClick={() => onSelectMethod?.(method)}
                className="flex min-w-[160px] shrink-0 snap-start flex-col gap-1 rounded-lg bg-muted/50 p-3 text-left hover:bg-muted md:min-w-0 md:w-full md:flex-row md:items-center md:justify-between"
              >
                <span className="flex items-center gap-2 text-sm">
                  <Wallet className="h-4 w-4" /> {method.name}
                </span>
                <span className="font-semibold">R$ {Number(method.balance).toFixed(2)}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 h-full">
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
