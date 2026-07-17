import React, { useState } from "react";
import { Plus, ArrowRightLeft, Banknote, Barcode, CreditCard, FileText, TrendingUp, Wallet } from "lucide-react";
import { startOfMonth, endOfMonth, format } from "date-fns";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Layout from "@/components/Layout";
import Dashboard from "@/components/Dashboard";
import AddExpenseDialog from "@/components/AddExpenseDialog";
import AddPaymentMethodDialog from "@/components/AddPaymentMethodDialog";
import AddTransferDialog from "@/components/AddTransferDialog";
import EditExpenseDialog from "@/components/EditExpenseDialog";
import FloatingAddButton from "@/components/FloatingAddButton";
import PayInvoiceDialog from "@/components/PayInvoiceDialog";
import { api } from "@/lib/api";

function Home() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialog, setDialog] = useState(null);
  const [expenseToEdit, setExpenseToEdit] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  
  const monthStr = format(selectedMonth, 'yyyy-MM');

  // 1. Dados Globais (Cartões, Faturas, Saldo)
  const { data: dashboard } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => api("/dashboard").then(res => res.data),
    initialData: { balance: 0, payment_methods: [], invoices: [] }
  });

  // 2. Resumo do Mês (Pizza e Totais)
  const { data: summary } = useQuery({
    queryKey: ["summary", monthStr],
    queryFn: () => api(`/dashboard/summary?month=${monthStr}`).then(res => res.data),
    initialData: { credit: 0, debit: 0, deposit: 0 }
  });

  // 3. Gráfico de Evolução (Últimos 6 meses)
  const { data: evolution } = useQuery({
    queryKey: ["evolution", monthStr],
    queryFn: () => api(`/dashboard/evolution?month=${monthStr}`).then(res => res.data),
    initialData: { monthly: [], daily: [] }
  });

  // 4. Lista de Movimentações do Mês
  const { data: expenses = [] } = useQuery({
    queryKey: ["expenses", monthStr],
    queryFn: () => {
      const start = format(startOfMonth(selectedMonth), 'yyyy-MM-dd');
      const end = format(endOfMonth(selectedMonth), 'yyyy-MM-dd');
      return api(`/expenses?from=${start}&to=${end}&per_page=1000`).then(res => res.data);
    }
  });

  const refreshData = () => {
    queryClient.invalidateQueries(["dashboard"]);
    queryClient.invalidateQueries(["summary"]);
    queryClient.invalidateQueries(["evolution"]);
    queryClient.invalidateQueries(["expenses"]);
  };

  const handleCreateTransaction = async (payload) => {
    try {
      await api("/expenses", { method: "POST", body: JSON.stringify(payload) });
      refreshData();
      setDialog(null);
      toast({ title: "Transação registada com sucesso." });
    } catch (error) {
      toast({ title: "Erro ao registar", description: error.message, variant: "destructive" });
    }
  };

  const handleSaveExpense = async (expense) => {
    try {
      await api(`/expenses/${expense.id}`, { method: "PATCH", body: JSON.stringify(expense) });
      refreshData();
      setDialog(null);
      toast({ title: "Transação atualizada com sucesso." });
    } catch (error) {
      toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteExpense = async (expense) => {
    if (!window.confirm(`Excluir "${expense.description}"?`)) return;
    try {
      await api(`/expenses/${expense.id}`, { method: "DELETE" });
      refreshData();
      toast({ title: "Transação excluída." });
    } catch (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    }
  };

  const handleCreatePaymentMethod = async (payload) => {
    try {
      await api("/payment-methods", { method: "POST", body: JSON.stringify(payload) });
      refreshData();
      setDialog(null);
      toast({ title: "Método criado com sucesso." });
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
      setDialog(null);
      toast({ title: "Fatura paga com sucesso." });
      return true;
    } catch (error) {
      toast({ title: "Erro ao pagar fatura", description: error.message, variant: "destructive" });
      return false;
    }
  };

  const openEdit = (expense) => {
    setExpenseToEdit(expense);
    setDialog("edit");
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-primary/20 to-muted px-4 py-8">
        <div className="mx-auto w-full max-w-6xl space-y-6">
          <div className="flex justify-end">
             <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="hidden gap-2 sm:flex">
                  <Plus className="h-5 w-5" /> Nova Transação
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => setDialog("deposit")} className="gap-2 p-3">
                  <TrendingUp className="h-4 w-4 text-emerald-500" /> Novo Depósito
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDialog("debit")} className="gap-2 p-3">
                  <Banknote className="h-4 w-4 text-green-500" /> Novo Débito
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDialog("credit")} className="gap-2 p-3">
                  <CreditCard className="h-4 w-4 text-blue-500" /> Nova Compra no Crédito
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDialog("transfer")} className="gap-2 p-3">
                  <ArrowRightLeft className="h-4 w-4 text-orange-500" /> Transferência
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDialog("invoice")} className="gap-2 p-3">
                  <FileText className="h-4 w-4 text-purple-500" /> Pagar Fatura
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDialog("boleto")} className="gap-2 p-3">
                  <Barcode className="h-4 w-4 text-red-500" /> Pagar Boleto
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDialog("method")} className="gap-2 border-t p-3">
                  <Wallet className="h-4 w-4 text-orange-500" /> Novo Cartão/Conta
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="rounded-xl border bg-card/90 p-6 shadow-md">
            <Dashboard
              expenses={expenses}
              dashboard={dashboard}
              summary={summary}
              evolution={evolution}
              onUpdateBalance={handleUpdateBalance}
              onEditExpense={openEdit}
              onDeleteExpense={handleDeleteExpense}
              selectedMonth={selectedMonth}
              onMonthChange={setSelectedMonth}
            />
          </div>
        </div>

        <FloatingAddButton
          onAddDeposit={() => setDialog("deposit")}
          onAddExpense={() => setDialog("debit")}
          onAddCreditExpense={() => setDialog("credit")}
          onAddTransfer={() => setDialog("transfer")}
          onPayInvoice={() => setDialog("invoice")}
          onAddBoleto={() => setDialog("boleto")}
          onAddPaymentMethod={() => setDialog("method")}
        />

        <AddExpenseDialog open={dialog === "deposit"} onOpenChange={(open) => !open && setDialog(null)} onAddExpense={handleCreateTransaction} paymentMethods={dashboard.payment_methods} paymentType="deposit" title="Registrar Entrada / Depósito" submitLabel="Fazer Depósito" />
        <AddExpenseDialog open={dialog === "debit"} onOpenChange={(open) => !open && setDialog(null)} onAddExpense={handleCreateTransaction} paymentMethods={dashboard.payment_methods} paymentType="debit" title="Adicionar Compra no Débito" />
        <AddExpenseDialog open={dialog === "credit"} onOpenChange={(open) => !open && setDialog(null)} onAddExpense={handleCreateTransaction} paymentMethods={dashboard.payment_methods} paymentType="credit" title="Adicionar Compra no Crédito" />
        <AddExpenseDialog open={dialog === "boleto"} onOpenChange={(open) => !open && setDialog(null)} onAddExpense={handleCreateTransaction} paymentMethods={dashboard.payment_methods} paymentType="boleto" title="Pagar Boleto" submitLabel="Pagar Boleto" />
        <AddTransferDialog open={dialog === "transfer"} onOpenChange={(open) => !open && setDialog(null)} onAddTransfer={handleCreateTransaction} paymentMethods={dashboard.payment_methods} />
        <PayInvoiceDialog open={dialog === "invoice"} onOpenChange={(open) => !open && setDialog(null)} paymentMethods={dashboard.payment_methods} invoices={dashboard.invoices} onConfirmPayment={handlePayInvoice} />
        <AddPaymentMethodDialog open={dialog === "method"} onOpenChange={(open) => !open && setDialog(null)} onAddPaymentMethod={handleCreatePaymentMethod} />
        <EditExpenseDialog open={dialog === "edit"} onOpenChange={(open) => !open && setDialog(null)} onSave={handleSaveExpense} paymentMethods={dashboard.payment_methods} expense={expenseToEdit} />
      </div>
    </Layout>
  );
}

export default Home;