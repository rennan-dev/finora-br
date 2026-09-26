import React, { createContext, useContext, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { api } from "@/lib/api";
import AddExpenseDialog from "@/components/AddExpenseDialog";
import AddPaymentMethodDialog from "@/components/AddPaymentMethodDialog";
import AddRecurringExpenseDialog from "@/components/AddRecurringExpenseDialog";
import AddTransferDialog from "@/components/AddTransferDialog";
import EditExpenseDialog from "@/components/EditExpenseDialog";
import ManageRecurringExpensesDialog from "@/components/ManageRecurringExpensesDialog";
import PayInvoiceDialog from "@/components/PayInvoiceDialog";
import UpdateBalanceDialog from "@/components/UpdateBalanceDialog";
import BottomNavigation from "@/components/BottomNavigation";

const TransactionContext = createContext(null);

export function useTransactions() {
  const context = useContext(TransactionContext);

  if (!context) {
    throw new Error("useTransactions precisa ser usado dentro de TransactionProvider.");
  }

  return context;
}

/**
 * Centraliza os dados globais (cartões, saldo, faturas), o mês selecionado e
 * todos os diálogos de transação. Dessa forma o botão central da Bottom
 * Navigation Bar pode abrir os fluxos a partir de qualquer página.
 */
export function TransactionProvider({ children }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialog, setDialog] = useState(null);
  const [expenseToEdit, setExpenseToEdit] = useState(null);
  const [invoiceToPay, setInvoiceToPay] = useState(null);
  const [methodToEdit, setMethodToEdit] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  // 1. Dados Globais (Cartões, Faturas, Saldo)
  const { data: dashboard } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => api("/dashboard").then((res) => res.data),
    initialData: { balance: 0, payment_methods: [], invoices: [] },
  });

  const refreshData = () => {
    queryClient.invalidateQueries(["dashboard"]);
    queryClient.invalidateQueries(["summary"]);
    queryClient.invalidateQueries(["evolution"]);
    queryClient.invalidateQueries(["expenses"]);
    queryClient.invalidateQueries(["invoice"]);
  };

  const closeDialog = () => {
    setDialog(null);
    setExpenseToEdit(null);
    setInvoiceToPay(null);
  };

  const openDialog = (name) => {
    setExpenseToEdit(null);
    setInvoiceToPay(null);
    setDialog(name);
  };

  const openEditExpense = (expense) => {
    setExpenseToEdit(expense);
    setInvoiceToPay(null);
    setDialog("edit");
  };

  const openInvoicePayment = (invoice = null) => {
    setExpenseToEdit(null);
    setInvoiceToPay(invoice);
    setDialog("invoice");
  };

  const openBalanceDialog = (method) => {
    setMethodToEdit(method);
  };

  const handleCreateTransaction = async (payload) => {
    try {
      await api("/expenses", { method: "POST", body: JSON.stringify(payload) });
      refreshData();
      closeDialog();
      toast({ title: "Transação registada com sucesso.", variant: "success" });
    } catch (error) {
      toast({ title: "Erro ao registar", description: error.message, variant: "destructive" });
    }
  };

  const handleSaveExpense = async (expense) => {
    try {
      await api(`/expenses/${expense.id}`, { method: "PATCH", body: JSON.stringify(expense) });
      refreshData();
      closeDialog();
      toast({ title: "Transação atualizada com sucesso.", variant: "success" });
    } catch (error) {
      toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteExpense = async (expense) => {
    if (!window.confirm(`Excluir "${expense.description}"?`)) return;
    try {
      await api(`/expenses/${expense.id}`, { method: "DELETE" });
      refreshData();
      toast({ title: "Transação excluída.", variant: "success" });
    } catch (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    }
  };

  const handleMarkAsPaid = async (expense) => {
    try {
      await api(`/expenses/${expense.id}/pay`, { method: "POST" });
      refreshData();
      toast({ title: "Despesa marcada como paga com sucesso." });
    } catch (error) {
      toast({ title: "Erro ao marcar como paga", description: error.message, variant: "destructive" });
    }
  };

  const handleCreatePaymentMethod = async (payload) => {
    try {
      await api("/payment-methods", { method: "POST", body: JSON.stringify(payload) });
      refreshData();
      closeDialog();
      toast({ title: "Método criado com sucesso.", variant: "success" });
    } catch (error) {
      toast({ title: "Erro ao criar método", description: error.message, variant: "destructive" });
    }
  };

  const handleUpdateBalance = async (paymentMethodId, balance) => {
    try {
      await api(`/payment-methods/${paymentMethodId}`, { method: "PATCH", body: JSON.stringify({ balance }) });
      refreshData();
      toast({ title: "Saldo atualizado com sucesso." });
    } catch (error) {
      toast({ title: "Erro ao atualizar saldo", description: error.message, variant: "destructive" });
    }
  };

  const handlePayInvoice = async (invoiceId, payload) => {
    try {
      await api(`/invoices/${invoiceId}/pay`, { method: "POST", body: JSON.stringify(payload) });
      refreshData();
      closeDialog();
      toast({ title: "Fatura paga com sucesso.", variant: "success" });
      return true;
    } catch (error) {
      toast({ title: "Erro ao pagar fatura", description: error.message, variant: "destructive" });
      return false;
    }
  };

  const handleCreateRecurringExpense = async (payload) => {
    try {
      await api("/recurring-expenses", { method: "POST", body: JSON.stringify(payload) });
      refreshData();
      closeDialog();
      toast({ title: "Despesa fixa criada com sucesso.", variant: "success" });
    } catch (error) {
      toast({ title: "Erro ao criar despesa fixa", description: error.message, variant: "destructive" });
    }
  };

  const value = {
    dashboard,
    paymentMethods: dashboard.payment_methods,
    invoices: dashboard.invoices,
    selectedMonth,
    setSelectedMonth,
    refreshData,
    openDialog,
    openEditExpense,
    openInvoicePayment,
    openBalanceDialog,
    deleteExpense: handleDeleteExpense,
    markAsPaid: handleMarkAsPaid,
  };

  return (
    <TransactionContext.Provider value={value}>
      {children}

      <BottomNavigation
        onAddDeposit={() => openDialog("deposit")}
        onAddExpense={() => openDialog("debit")}
        onAddCreditExpense={() => openDialog("credit")}
        onAddTransfer={() => openDialog("transfer")}
        onPayInvoice={() => openInvoicePayment(null)}
        onAddBoleto={() => openDialog("boleto")}
        onAddPaymentMethod={() => openDialog("method")}
        onAddRecurringExpense={() => openDialog("recurring")}
        onManageRecurringExpenses={() => openDialog("manage-recurring")}
      />

      <AddExpenseDialog open={dialog === "deposit"} onOpenChange={(open) => !open && closeDialog()} onAddExpense={handleCreateTransaction} paymentMethods={dashboard.payment_methods} paymentType="deposit" title="Registrar Entrada / Depósito" submitLabel="Fazer Depósito" />
      <AddExpenseDialog open={dialog === "debit"} onOpenChange={(open) => !open && closeDialog()} onAddExpense={handleCreateTransaction} paymentMethods={dashboard.payment_methods} paymentType="debit" title="Adicionar Compra no Débito" />
      <AddExpenseDialog open={dialog === "credit"} onOpenChange={(open) => !open && closeDialog()} onAddExpense={handleCreateTransaction} paymentMethods={dashboard.payment_methods} paymentType="credit" title="Adicionar Compra no Crédito" />
      <AddExpenseDialog open={dialog === "boleto"} onOpenChange={(open) => !open && closeDialog()} onAddExpense={handleCreateTransaction} paymentMethods={dashboard.payment_methods} paymentType="boleto" title="Pagar Boleto" submitLabel="Pagar Boleto" />
      <AddTransferDialog open={dialog === "transfer"} onOpenChange={(open) => !open && closeDialog()} onAddTransfer={handleCreateTransaction} paymentMethods={dashboard.payment_methods} />
      <PayInvoiceDialog open={dialog === "invoice"} onOpenChange={(open) => !open && closeDialog()} paymentMethods={dashboard.payment_methods} invoices={dashboard.invoices} initialInvoiceId={invoiceToPay?.id} onConfirmPayment={handlePayInvoice} />
      <AddPaymentMethodDialog open={dialog === "method"} onOpenChange={(open) => !open && closeDialog()} onAddPaymentMethod={handleCreatePaymentMethod} />
      <AddRecurringExpenseDialog open={dialog === "recurring"} onOpenChange={(open) => !open && closeDialog()} onAddRecurringExpense={handleCreateRecurringExpense} paymentMethods={dashboard.payment_methods} />
      <ManageRecurringExpensesDialog open={dialog === "manage-recurring"} onOpenChange={(open) => !open && closeDialog()} paymentMethods={dashboard.payment_methods} onRefresh={refreshData} />
      <EditExpenseDialog open={dialog === "edit"} onOpenChange={(open) => !open && closeDialog()} onSave={handleSaveExpense} paymentMethods={dashboard.payment_methods} expense={expenseToEdit} />
      <UpdateBalanceDialog
        open={Boolean(methodToEdit)}
        onOpenChange={(open) => !open && setMethodToEdit(null)}
        currentBalance={methodToEdit?.balance ?? 0}
        selectedMethodId={methodToEdit?.id}
        onUpdateBalance={handleUpdateBalance}
        paymentMethods={dashboard.payment_methods}
      />
    </TransactionContext.Provider>
  );
}

export default TransactionProvider;

