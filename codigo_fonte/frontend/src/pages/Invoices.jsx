import React, { useMemo, useState } from "react";
import { format } from "date-fns";
import { CalendarClock, CheckCircle2, CreditCard, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";
import InvoiceDetailsDialog from "@/components/InvoiceDetailsDialog";
import { useTransactions } from "@/components/TransactionProvider";

function formatReference(invoice) {
  return `${String(invoice.reference_month).padStart(2, "0")}/${invoice.reference_year}`;
}

/**
 * Aba "Faturas" da Bottom Navigation Bar: faturas abertas e fechadas.
 */
function Invoices() {
  const { invoices, openInvoicePayment, openEditExpense, deleteExpense } = useTransactions();
  const [invoiceInDetails, setInvoiceInDetails] = useState(null);

  const openInvoices = useMemo(() => invoices.filter((invoice) => invoice.status === "open"), [invoices]);
  const closedInvoices = useMemo(() => invoices.filter((invoice) => invoice.status === "paid"), [invoices]);
  const openInvoicesTotal = openInvoices.reduce((total, invoice) => total + Number(invoice.total_amount), 0);

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-primary/20 to-muted px-4 py-6 md:py-8">
        <div className="mx-auto w-full max-w-5xl space-y-6">
          <header className="space-y-1">
            <h1 className="text-2xl font-bold md:text-3xl">Faturas</h1>
            <p className="text-sm text-muted-foreground">
              Acompanhe as faturas abertas e o histórico das já fechadas.
            </p>
          </header>

          <section className="space-y-4 rounded-xl border bg-card p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 font-semibold">
                <CalendarClock className="h-5 w-5 text-primary" /> Faturas abertas
              </h2>
              <span className="text-sm text-muted-foreground">
                Total: R$ {openInvoicesTotal.toFixed(2)}
              </span>
            </div>

            {openInvoices.length === 0 ? (
              <EmptyMessage message="Nenhuma fatura aberta no momento." />
            ) : (
              <div className="space-y-3">
                {openInvoices.map((invoice) => (
                  <article key={invoice.id} className="space-y-3 rounded-lg border bg-muted/30 p-4">
                    <InvoiceHeader
                      invoice={invoice}
                      subtitle="Fatura em aberto"
                    />

                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => setInvoiceInDetails(invoice)}
                      >
                        <FileText className="h-4 w-4" /> Ver compras
                      </Button>
                      <Button
                        size="sm"
                        className="gap-2"
                        disabled={Number(invoice.total_amount) <= 0}
                        onClick={() => openInvoicePayment(invoice)}
                      >
                        <CreditCard className="h-4 w-4" /> Pagar fatura
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>


          <section className="space-y-4 rounded-xl border bg-card p-5">
            <h2 className="flex items-center gap-2 font-semibold">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" /> Faturas fechadas
            </h2>

            {closedInvoices.length === 0 ? (
              <EmptyMessage message="Nenhuma fatura fechada até agora." />
            ) : (
              <div className="space-y-3">
                {closedInvoices.map((invoice) => (
                  <article key={invoice.id} className="space-y-3 rounded-lg border bg-muted/30 p-4">
                    <InvoiceHeader
                      invoice={invoice}
                      subtitle={
                        <>
                          {invoice.paid_at
                            ? `Paga em ${format(new Date(invoice.paid_at), "dd/MM/yyyy")}`
                            : "Fatura fechada"}
                          {invoice.paid_from_payment_method?.name
                            ? ` · Pago com ${invoice.paid_from_payment_method.name}`
                            : ""}
                        </>
                      }
                    />

                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => setInvoiceInDetails(invoice)}
                    >
                      <FileText className="h-4 w-4" /> Ver compras
                    </Button>
                  </article>
                ))}
              </div>
            )}
          </section>

        </div>
      </div>

      <InvoiceDetailsDialog
        open={Boolean(invoiceInDetails)}
        onOpenChange={(open) => !open && setInvoiceInDetails(null)}
        invoice={invoiceInDetails}
        onEditExpense={openEditExpense}
        onDeleteExpense={deleteExpense}
      />

    </Layout>
  );
}

function InvoiceHeader({ invoice, subtitle }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-medium">{invoice.payment_method?.name || "Cartão"}</h3>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            {formatReference(invoice)}
          </span>
          {invoice.cycle > 1 && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              Ciclo {invoice.cycle}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
      <strong className="whitespace-nowrap text-lg">
        R$ {Number(invoice.total_amount).toFixed(2)}
      </strong>
    </div>
  );
}

function EmptyMessage({ message }) {
  return (
    <div className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}

export default Invoices;
