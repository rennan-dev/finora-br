import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Plus } from "lucide-react";
import { api } from "@/lib/api";

function ManageRecurringExpensesDialog({ open, onOpenChange, paymentMethods, onRefresh }) {
  const [recurringExpenses, setRecurringExpenses] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadRecurringExpenses();
    }
  }, [open]);

  const loadRecurringExpenses = async () => {
    setLoading(true);
    try {
      const response = await api("/recurring-expenses");
      setRecurringExpenses(response.data);
    } catch (error) {
      console.error("Erro ao carregar despesas fixas:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Deseja realmente excluir esta despesa fixa?")) return;
    try {
      await api(`/recurring-expenses/${id}`, { method: "DELETE" });
      await loadRecurringExpenses();
      onRefresh?.();
    } catch (error) {
      alert("Erro ao excluir: " + error.message);
    }
  };

  const getPaymentMethodName = (id) => {
    const method = paymentMethods.find((m) => m.id === id);
    return method?.name || "Desconhecido";
  };

  const totalAmount = recurringExpenses.reduce(
    (acc, expense) => acc + Number(expense.amount),
    0
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerenciar Despesas Fixas</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {loading ? (
            <p className="text-center text-muted-foreground">Carregando...</p>
          ) : recurringExpenses.length === 0 ? (
            <p className="text-center text-muted-foreground">Nenhuma despesa fixa cadastrada.</p>
          ) : (
            <>
              {recurringExpenses.map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between rounded-lg border bg-card p-4"
                >
                  <div className="flex-1">
                    <h3 className="font-medium">{expense.description}</h3>
                    <p className="text-sm text-muted-foreground">
                      R$ {Number(expense.amount).toFixed(2)} · {getPaymentMethodName(expense.payment_method_id)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {expense.is_active ? "✅ Ativa" : "❌ Inativa"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(expense.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between rounded-lg border bg-muted/50 p-4 mt-4 font-semibold">
                <span>Total de Despesas Fixas</span>
                <span>R$ {totalAmount.toFixed(2)}</span>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ManageRecurringExpensesDialog;