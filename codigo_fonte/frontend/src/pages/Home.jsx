import React from "react";
import { endOfMonth, format, startOfMonth } from "date-fns";
import { Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import Layout from "@/components/Layout";
import BalanceCards from "@/components/BalanceCards";
import MovementsSection from "@/components/MovementsSection";
import TransactionMenu from "@/components/TransactionMenu";
import { useTransactions } from "@/components/TransactionProvider";
import { api } from "@/lib/api";

/**
 * Aba "Compras" da Bottom Navigation Bar: cartões com o dinheiro disponível
 * no topo e as movimentações do mês selecionado.
 */
function Home() {
  const {
    dashboard,
    selectedMonth,
    setSelectedMonth,
    openDialog,
    openEditExpense,
    openBalanceDialog,
    deleteExpense,
    markAsPaid,
  } = useTransactions();

  const monthStr = format(selectedMonth, "yyyy-MM");

  // 1. Resumo do Mês (totais em cards)
  const { data: summary } = useQuery({
    queryKey: ["summary", monthStr],
    queryFn: () => api(`/dashboard/summary?month=${monthStr}`).then((res) => res.data),
    initialData: { credit: 0, debit: 0, deposit: 0 },
  });

  // 2. Lista de Movimentações do Mês
  const { data: expenses = [] } = useQuery({
    queryKey: ["expenses", monthStr],
    queryFn: () => {
      const start = format(startOfMonth(selectedMonth), "yyyy-MM-dd");
      const end = format(endOfMonth(selectedMonth), "yyyy-MM-dd");
      return api(`/expenses?from=${start}&to=${end}&per_page=1000`).then((res) => res.data);
    },
  });

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-primary/20 to-muted px-4 py-6 md:py-8">
        <div className="mx-auto w-full max-w-6xl space-y-6">
          <div className="flex items-start justify-between gap-3">
            <header className="space-y-1">
              <h1 className="text-2xl font-bold md:text-3xl">Compras</h1>
              <p className="text-sm text-muted-foreground">
                Seus cartões e as movimentações do mês.
              </p>
            </header>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="hidden gap-2 sm:flex">
                  <Plus className="h-5 w-5" /> Nova Transação
                </Button>
              </DropdownMenuTrigger>
              <TransactionMenu
                onAddDeposit={() => openDialog("deposit")}
                onAddExpense={() => openDialog("debit")}
                onAddCreditExpense={() => openDialog("credit")}
                onAddTransfer={() => openDialog("transfer")}
                onPayInvoice={() => openDialog("invoice")}
                onAddBoleto={() => openDialog("boleto")}
                onAddPaymentMethod={() => openDialog("method")}
                onAddRecurringExpense={() => openDialog("recurring")}
                onManageRecurringExpenses={() => openDialog("manage-recurring")}
              />
            </DropdownMenu>
          </div>

          <BalanceCards
            dashboard={dashboard}
            summary={summary}
            selectedMonth={selectedMonth}
            onSelectMethod={openBalanceDialog}
          />

          <MovementsSection
            expenses={expenses}
            paymentMethods={dashboard.payment_methods}
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
            onEdit={openEditExpense}
            onDelete={deleteExpense}
            onMarkAsPaid={markAsPaid}
          />
        </div>
      </div>
    </Layout>
  );
}

export default Home;
