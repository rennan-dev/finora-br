import React from "react";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import ExpenseCharts from "@/components/ExpenseCharts";
import { useTransactions } from "@/components/TransactionProvider";
import { api } from "@/lib/api";

/**
 * Aba "Gráficos" da Bottom Navigation Bar: reúne os gráficos existentes
 * (distribuição de gastos e evolução), compartilhando o mês selecionado.
 */
function Charts() {
  const { selectedMonth, setSelectedMonth } = useTransactions();
  const monthStr = format(selectedMonth, "yyyy-MM");

  const { data: summary } = useQuery({
    queryKey: ["summary", monthStr],
    queryFn: () => api(`/dashboard/summary?month=${monthStr}`).then((res) => res.data),
    initialData: { credit: 0, debit: 0, deposit: 0 },
  });

  const { data: evolution } = useQuery({
    queryKey: ["evolution", monthStr],
    queryFn: () => api(`/dashboard/evolution?month=${monthStr}`).then((res) => res.data),
    initialData: { monthly: [], daily: [] },
  });

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-primary/20 to-muted px-4 py-6 md:py-8">
        <div className="mx-auto w-full max-w-6xl space-y-6">
          <header className="space-y-1">
            <h1 className="text-2xl font-bold md:text-3xl">Gráficos</h1>
            <p className="text-sm text-muted-foreground">
              Visualize a distribuição e a evolução dos seus gastos.
            </p>
          </header>

          <ExpenseCharts
            summary={summary}
            evolution={evolution}
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
          />
        </div>
      </div>
    </Layout>
  );
}

export default Charts;
