import React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const expenseLabels = {
  credit: "Crédito",
  debit: "Débito",
  deposit: "Depósito",
  transfer: "Transferência",
  boleto: "Boleto",
  invoice_payment: "Pagamento de fatura",
};

const colors = {
  credit: "bg-emerald-100 text-emerald-800",
  debit: "bg-blue-100 text-blue-800",
  deposit: "bg-purple-100 text-purple-800",
  transfer: "bg-orange-100 text-orange-800",
  boleto: "bg-red-100 text-red-800",
  invoice_payment: "bg-slate-100 text-slate-800",
};

function ExpenseList({ expenses, filterType = "all", onEdit, onDelete }) {
  const visibleExpenses = expenses.filter(
    (expense) => filterType === "all" || expense.type === filterType
  );

  return (
    <div className="space-y-3">
      {visibleExpenses.length === 0 ? (
        <div className="rounded-lg border border-dashed py-8 text-center text-muted-foreground">
          Nenhuma transação encontrada.
        </div>
      ) : (
        visibleExpenses.map((expense) => {
          const isPaidCredit =
            expense.type === "credit" && expense.invoice?.status === "paid";
          const editable = expense.type !== "invoice_payment" && !isPaidCredit;
          const transactionDate = new Date(`${expense.transaction_date}T00:00:00`);

          return (
            <div
              key={expense.id}
              className="flex flex-col gap-3 rounded-lg border bg-card p-4 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">{expense.description}</h3>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      colors[expense.type]
                    }`}
                  >
                    {expenseLabels[expense.type]}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {format(transactionDate, "dd 'de' MMMM 'de' yyyy", {
                    locale: ptBR,
                  })}
                  {expense.type === "credit" && expense.invoice && (
                    <>
                      {" · "}Fatura{" "}
                      {String(expense.invoice.reference_month).padStart(2, "0")}/
                      {expense.invoice.reference_year}
                      {expense.invoice.cycle > 1 &&
                        ` · Ciclo ${expense.invoice.cycle}`}
                    </>
                  )}
                  {" · "}
                  {expense.payment_method?.name}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <strong>R$ {Number(expense.amount).toFixed(2)}</strong>
                {editable && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit?.(expense)}>
                        <Pencil className="mr-2 h-4 w-4" /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => onDelete?.(expense)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

export default ExpenseList;