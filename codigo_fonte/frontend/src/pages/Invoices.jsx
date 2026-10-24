import React, { useMemo, useState } from "react";
import { format } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CreditCard,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";
import InvoiceDetailsDialog from "@/components/InvoiceDetailsDialog";
import { useTransactions } from "@/components/TransactionProvider";

const MESES_PT = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

function formatReference(invoice) {
  return `${String(invoice.reference_month).padStart(2, "0")}/${invoice.reference_year}`;
}

function formatMonthLabel(invoice) {
  return `${MESES_PT[invoice.reference_month - 1]}/${invoice.reference_year}`;
}

function monthKey(invoice) {
  return `${invoice.reference_year}-${String(invoice.reference_month).padStart(2, "0")}`;
}

/**
 * Aba "Faturas" da Bottom Navigation Bar: faturas abertas e fechadas.
 */
function Invoices() {
  const { invoices, openInvoicePayment, openEditExpense, deleteExpense } = useTransactions();
  const [invoiceInDetails, setInvoiceInDetails] = useState(null);
  const [expandedMonthKey, setExpandedMonthKey] = useState(null);
  const [expandedClosedMonthKey, setExpandedClosedMonthKey] = useState(null);

  const openInvoices = useMemo(() => invoices.filter((invoice) => invoice.status === "open"), [
    invoices,
  ]);
  const closedInvoices = useMemo(() => invoices.filter((invoice) => invoice.status === "paid"), [
    invoices,
  ]);

  // Ordena do mês mais recente para o mais antigo (ano desc, mês desc).
  const sortedClosedInvoices = useMemo(
    () =>
      [...closedInvoices].sort((a, b) => {
        if (b.reference_year !== a.reference_year) {
          return b.reference_year - a.reference_year;
        }
        return b.reference_month - a.reference_month;
      }),
    [closedInvoices]
  );

  // Agrupa as faturas fechadas pelo mês de referência.
  const closedGroups = useMemo(() => {
    const map = new Map();
    for (const invoice of sortedClosedInvoices) {
      const key = monthKey(invoice);
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key).push(invoice);
    }
    return [...map.entries()];
  }, [sortedClosedInvoices]);
  const openInvoicesTotal = openInvoices.reduce((total, invoice) => total + Number(invoice.total_amount), 0);

  // Ordena do mês mais recente para o mais antigo (ano desc, mês desc).
  const sortedOpenInvoices = useMemo(
    () =>
      [...openInvoices].sort((a, b) => {
        if (b.reference_year !== a.reference_year) {
          return b.reference_year - a.reference_year;
        }
        return b.reference_month - a.reference_month;
      }),
    [openInvoices]
  );

  // Agrupa as faturas abertas pelo mês de referência.
  const groups = useMemo(() => {
    const map = new Map();
    for (const invoice of sortedOpenInvoices) {
      const key = monthKey(invoice);
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key).push(invoice);
    }
    return [...map.entries()];
  }, [sortedOpenInvoices]);

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
                {groups.map(([key, invoicesInMonth]) => {
                  const monthLabel = formatMonthLabel(invoicesInMonth[0]);
                  const monthTotal = invoicesInMonth.reduce(
                    (total, invoice) => total + Number(invoice.total_amount),
                    0
                  );
                  const isExpanded = expandedMonthKey === key;

                  return (
                    <article key={key} className="rounded-lg border bg-muted/30 p-4">
                      <div
                        onClick={() => setExpandedMonthKey(isExpanded ? null : key)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            setExpandedMonthKey(isExpanded ? null : key);
                          }
                        }}
                        role="button"
                        tabIndex={0}
                        className="cursor-pointer select-none flex items-center justify-between gap-2"
                      >
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{monthLabel}</span>
                            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                              {invoicesInMonth.length} fatura{
                                invoicesInMonth.length > 1 ? "s" : ""
                              }
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">Total do mês</span>
                        </div>
                        <div className="whitespace-nowrap text-lg font-bold">
                          R$ {monthTotal.toFixed(2)}
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            className="mt-3 space-y-3"
                          >
                            {invoicesInMonth.map((invoice) => (
                              <InvoiceCard
                                key={invoice.id}
                                invoice={invoice}
                                showReference={false}
                                onView={() => setInvoiceInDetails(invoice)}
                                onPay={() => openInvoicePayment(invoice)}
                              />
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </article>
                  );
                })}
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
                {closedGroups.map(([key, invoicesInMonth]) => {
                  const monthLabel = formatMonthLabel(invoicesInMonth[0]);
                  const monthTotal = invoicesInMonth.reduce(
                    (total, invoice) => total + Number(invoice.total_amount),
                    0
                  );
                  const isExpanded = expandedClosedMonthKey === key;

                  return (
                    <article key={key} className="rounded-lg border bg-muted/30 p-4">
                      <div
                        onClick={() => setExpandedClosedMonthKey(isExpanded ? null : key)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            setExpandedClosedMonthKey(isExpanded ? null : key);
                          }
                        }}
                        role="button"
                        tabIndex={0}
                        className="cursor-pointer select-none flex items-center justify-between gap-2"
                      >
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{monthLabel}</span>
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                              {invoicesInMonth.length} fatura{
                                invoicesInMonth.length > 1 ? "s" : ""
                              }
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">Total do mês</span>
                        </div>
                        <div className="whitespace-nowrap text-lg font-bold">
                          R$ {monthTotal.toFixed(2)}
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            className="mt-3 space-y-3"
                          >
                            {invoicesInMonth.map((invoice) => (
                              <article
                                key={invoice.id}
                                className="space-y-3 rounded-lg border bg-muted/30 p-4"
                              >
                                <InvoiceHeader
                                  invoice={invoice}
                                  subtitle={
                                    <>
                                      {invoice.paid_at
                                        ? `Paga em ${format(
                                            new Date(invoice.paid_at),
                                            "dd/MM/yyyy"
                                          )}`
                                        : "Fatura fechada"}
                                      {invoice.paid_from_payment_method?.name
                                        ? ` · Pago com ${invoice.paid_from_payment_method.name}`
                                        : ""}
                                    </>
                                  }
                                  showReference={false}
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
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </article>
                  );
                })}
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

function InvoiceCard({ invoice, showReference = true, onView, onPay }) {
  return (
    <article className="space-y-3 rounded-lg border bg-muted/30 p-4">
      <InvoiceHeader invoice={invoice} subtitle="Fatura em aberto" showReference={showReference} />

      <div className="flex flex-wrap gap-2">
        {onView && (
          <Button variant="outline" size="sm" className="gap-2" onClick={onView}>
            <FileText className="h-4 w-4" /> Ver compras
          </Button>
        )}
        {onPay && (
          <Button
            size="sm"
            className="gap-2"
            disabled={Number(invoice.total_amount) <= 0}
            onClick={onPay}
          >
            <CreditCard className="h-4 w-4" /> Pagar fatura
          </Button>
        )}
      </div>
    </article>
  );
}

function InvoiceHeader({ invoice, subtitle, showReference = true }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-medium">{invoice.payment_method?.name || "Cartão"}</h3>
          {showReference && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {formatReference(invoice)}
            </span>
          )}
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
