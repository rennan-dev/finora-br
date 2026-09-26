import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ExpenseList from "@/components/ExpenseList";
import { api } from "@/lib/api";

/**
 * Mostra as compras (lançamentos de crédito) que compõem uma fatura.
 */
function InvoiceDetailsDialog({ open, onOpenChange, invoice, onEditExpense, onDeleteExpense }) {
  const { data, isFetching, error } = useQuery({
    queryKey: ["invoice", invoice?.id],
    queryFn: () => api(`/invoices/${invoice.id}`).then((response) => response.data),
    enabled: open && Boolean(invoice?.id),
  });

  const expenses = Array.isArray(data?.expenses) ? data.expenses : data?.expenses?.data ?? [];
  const reference = invoice
    ? `${String(invoice.reference_month).padStart(2, "0")}/${invoice.reference_year}`
    : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-[520px]" aria-describedby="invoice-details-description">
        <DialogHeader>
          <DialogTitle>
            {invoice?.payment_method?.name || "Fatura do cartão"} — {reference}
          </DialogTitle>
        </DialogHeader>

        <p id="invoice-details-description" className="text-sm text-muted-foreground">
          Compras que compõem esta fatura.
        </p>

        <div className="flex items-center justify-between rounded-lg bg-muted p-4">
          <span className="text-sm font-medium">Total da fatura</span>
          <span className="text-xl font-bold text-primary">
            R$ {Number(invoice?.total_amount || 0).toFixed(2)}
          </span>
        </div>

        {error ? (
          <p className="rounded-lg border border-dashed py-8 text-center text-sm text-destructive">
            {error.message}
          </p>
        ) : isFetching ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Carregando compras...</p>
        ) : (
          <ExpenseList
            expenses={expenses}
            onEdit={onEditExpense}
            onDelete={onDeleteExpense}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

export default InvoiceDetailsDialog;
