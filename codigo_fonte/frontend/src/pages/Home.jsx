import React, { useCallback, useEffect, useState } from "react";
import { Plus, ArrowRightLeft, Banknote, Barcode, CreditCard, FileText, TrendingUp, Wallet } from "lucide-react";
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
import { api, getPaymentMethods, setCachedPaymentMethods } from "@/lib/api";

function Home() {
  const { toast } = useToast();
  const [expenses, setExpenses] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [dialog, setDialog] = useState(null);
  const [expenseToEdit, setExpenseToEdit] = useState(null);

  const loadDashboard = useCallback(async () => {
    try {
      const response = await api("/dashboard");
      setExpenses(response.data.expenses);
      setPaymentMethods(response.data.payment_methods);
      setInvoices(response.data.invoices);
      setCachedPaymentMethods(response.data.payment_methods);
    } catch (error) {
      toast({
        title: "Erro ao carregar dados",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [toast]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const updatePaymentMethods = (updatedMethods) => {
    setPaymentMethods(updatedMethods);
    setCachedPaymentMethods(updatedMethods);
  };

  const mergeExpenseMethods = (expense) => {
    const relatedMethods = [expense.payment_method, expense.destination_payment_method].filter(Boolean);
    if (!relatedMethods.length) return;

    updatePaymentMethods(paymentMethods.map((method) =>
      relatedMethods.find((related) => related.id === method.id) || method
    ));
  };

  const mergeInvoice = (invoice) => {
    if (!invoice) return;
    setInvoices((current) => {
      const existing = current.some((item) => item.id === invoice.id);
      return existing
        ? current.map((item) => (item.id === invoice.id ? invoice : item))
        : [invoice, ...current];
    });
  };

  const handleCreateTransaction = async (payload) => {
    try {
      const response = await api("/expenses", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setExpenses((current) => [response.data, ...current].slice(0, 150));
      mergeExpenseMethods(response.data);
      mergeInvoice(response.data.invoice);
      toast({ title: "Transação registrada com sucesso." });
    } catch (error) {
      toast({ title: "Não foi possível registrar a transação", description: error.message, variant: "destructive" });
    }
  };

  const handleCreatePaymentMethod = async (payload) => {
    try {
      const response = await api("/payment-methods", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      updatePaymentMethods([
        ...paymentMethods.map((method) => response.data.is_favorite ? { ...method, is_favorite: false } : method),
        response.data,
      ]);
      toast({ title: "Método de pagamento criado com sucesso." });
    } catch (error) {
      toast({ title: "Não foi possível criar o método", description: error.message, variant: "destructive" });
    }
  };

  const handleUpdateBalance = async (paymentMethodId, balance) => {
    try {
      const response = await api(`/payment-methods/${paymentMethodId}`, {
        method: "PATCH",
        body: JSON.stringify({ balance }),
      });
      updatePaymentMethods(paymentMethods.map((method) => method.id === response.data.id ? response.data : method));
      toast({ title: "Saldo atualizado com sucesso." });
    } catch (error) {
      toast({ title: "Não foi possível atualizar o saldo", description: error.message, variant: "destructive" });
    }
  };

  const handleSaveExpense = async (expense) => {
    try {
      const response = await api(`/expenses/${expense.id}`, {
        method: "PATCH",
        body: JSON.stringify(expense),
      });
      setDialog(null);
      setExpenses((current) => current.map((item) => item.id === response.data.id ? response.data : item));
      updatePaymentMethods(await getPaymentMethods({ force: true }));
      mergeInvoice(response.data.invoice);
      if (expenseToEdit?.invoice_id && expenseToEdit.invoice_id !== response.data.invoice_id) {
        setInvoices((current) => current.map((invoice) => invoice.id === expenseToEdit.invoice_id
          ? { ...invoice, total_amount: Math.max(0, Number(invoice.total_amount) - Number(expenseToEdit.amount)) }
          : invoice));
      }
      toast({ title: "Transação atualizada com sucesso." });
    } catch (error) {
      toast({ title: "Não foi possível atualizar a transação", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteExpense = async (expense) => {
    if (!window.confirm(`Excluir "${expense.description}"?`)) return;

    try {
      await api(`/expenses/${expense.id}`, { method: "DELETE" });
      setExpenses((current) => current.filter((item) => item.id !== expense.id));
      updatePaymentMethods(paymentMethods.map((method) => {
        const amount = Number(expense.amount);
        if (expense.type === "deposit" && method.id === expense.payment_method_id) {
          return { ...method, balance: Number(method.balance) - amount };
        }
        if (["debit", "boleto", "invoice_payment"].includes(expense.type) && method.id === expense.payment_method_id) {
          return { ...method, balance: Number(method.balance) + amount };
        }
        if (expense.type === "transfer") {
          if (method.id === expense.payment_method_id) return { ...method, balance: Number(method.balance) + amount };
          if (method.id === expense.destination_payment_method_id) return { ...method, balance: Number(method.balance) - amount };
        }
        return method;
      }));
      if (expense.invoice_id) {
        setInvoices((current) => current.map((invoice) => invoice.id === expense.invoice_id
          ? { ...invoice, total_amount: Math.max(0, Number(invoice.total_amount) - Number(expense.amount)) }
          : invoice));
      }
      toast({ title: "Transação excluída com sucesso." });
    } catch (error) {
      toast({ title: "Não foi possível excluir a transação", description: error.message, variant: "destructive" });
    }
  };

  const handlePayInvoice = async (invoiceId, payload) => {
    try {
      const response = await api(`/invoices/${invoiceId}/pay`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      mergeInvoice(response.data);
      setExpenses((current) => [response.payment_expense, ...current].slice(0, 150));
      mergeExpenseMethods(response.payment_expense);
      toast({ title: "Fatura paga com sucesso." });
      return true;
    } catch (error) {
      toast({ title: "Não foi possível pagar a fatura", description: error.message, variant: "destructive" });
      return false;
    }
  };

  const totalBalance = paymentMethods
    .reduce((total, method) => total + Number(method.balance), 0);

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
                  <Plus className="h-5 w-5" />
                  Nova Transação
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
              invoices={invoices}
              paymentMethods={paymentMethods}
              totalBalance={totalBalance}
              onUpdateBalance={handleUpdateBalance}
              onEditExpense={openEdit}
              onDeleteExpense={handleDeleteExpense}
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

        <AddExpenseDialog
          open={dialog === "deposit"}
          onOpenChange={(open) => !open && setDialog(null)}
          onAddExpense={handleCreateTransaction}
          paymentMethods={paymentMethods}
          paymentType="deposit"
          title="Registrar Entrada / Depósito"
          submitLabel="Fazer Depósito"
        />
        <AddExpenseDialog
          open={dialog === "debit"}
          onOpenChange={(open) => !open && setDialog(null)}
          onAddExpense={handleCreateTransaction}
          paymentMethods={paymentMethods}
          paymentType="debit"
          title="Adicionar Compra no Débito"
        />
        <AddExpenseDialog
          open={dialog === "credit"}
          onOpenChange={(open) => !open && setDialog(null)}
          onAddExpense={handleCreateTransaction}
          paymentMethods={paymentMethods}
          paymentType="credit"
          title="Adicionar Compra no Crédito"
        />
        <AddExpenseDialog
          open={dialog === "boleto"}
          onOpenChange={(open) => !open && setDialog(null)}
          onAddExpense={handleCreateTransaction}
          paymentMethods={paymentMethods}
          paymentType="boleto"
          title="Pagar Boleto"
          submitLabel="Pagar Boleto"
        />
        <AddTransferDialog
          open={dialog === "transfer"}
          onOpenChange={(open) => !open && setDialog(null)}
          onAddTransfer={handleCreateTransaction}
          paymentMethods={paymentMethods}
        />
        <PayInvoiceDialog
          open={dialog === "invoice"}
          onOpenChange={(open) => !open && setDialog(null)}
          paymentMethods={paymentMethods}
          invoices={invoices}
          onConfirmPayment={handlePayInvoice}
        />
        <AddPaymentMethodDialog
          open={dialog === "method"}
          onOpenChange={(open) => !open && setDialog(null)}
          onAddPaymentMethod={handleCreatePaymentMethod}
        />
        <EditExpenseDialog
          open={dialog === "edit"}
          onOpenChange={(open) => !open && setDialog(null)}
          onSave={handleSaveExpense}
          paymentMethods={paymentMethods}
          expense={expenseToEdit}
        />
      </div>
    </Layout>
  );
}

export default Home;
