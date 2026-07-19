import React, { useMemo, useState } from "react";
// Adicionado o ícone 'Filter'
import { Download, CreditCard, Wallet, Loader2, Filter } from "lucide-react";
import {
  CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import ExpenseList, { expenseLabels } from "@/components/ExpenseList";
import MonthSelector from "@/components/MonthSelector";
import UpdateBalanceDialog from "@/components/UpdateBalanceDialog";

function Dashboard({ 
  expenses, dashboard, summary, evolution, 
  onUpdateBalance, onEditExpense, onDeleteExpense, selectedMonth, onMonthChange 
}) {
  const [methodToEdit, setMethodToEdit] = useState(null);
  const [evolutionPeriod, setEvolutionPeriod] = useState("monthly");
  const [expenseFilter, setExpenseFilter] = useState("all");
  const [isExporting, setIsExporting] = useState(false);

  const nextInvoiceReference = useMemo(
    () => new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1),
    [selectedMonth]
  );
  
  const openInvoiceTotal = useMemo(
    () => dashboard.invoices
      .filter((invoice) =>
        invoice.status === "open" &&
        invoice.reference_month === nextInvoiceReference.getMonth() + 1 &&
        invoice.reference_year === nextInvoiceReference.getFullYear()
      )
      .reduce((total, invoice) => total + Number(invoice.total_amount), 0),
    [dashboard.invoices, nextInvoiceReference]
  );
  
  const openInvoiceLabel = `Fatura aberta — ${String(nextInvoiceReference.getMonth() + 1).padStart(2, "0")}/${nextInvoiceReference.getFullYear()}`;

  const chartData = [
    { name: "Crédito", value: summary.credit, color: "#10b981" },
    { name: "Débito", value: summary.debit, color: "#3b82f6" },
    { name: "Depósito", value: summary.deposit, color: "#8b5cf6" },
  ].filter((entry) => entry.value > 0);

  const currentEvolutionData = useMemo(() => {
    if(evolution?.[evolutionPeriod]) {
        return evolution[evolutionPeriod];
    }
    
    if(evolution?.data?.[evolutionPeriod]) {
        return evolution.data[evolutionPeriod];
    }
    
    if(Array.isArray(evolution)) {
        return evolutionPeriod === "monthly" ? evolution : [];
    }
    
    return [];
  }, [evolution, evolutionPeriod]);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const monthStr = format(selectedMonth, 'yyyy-MM');
      const token = sessionStorage.getItem('financas.auth_token'); 
      
      if (!token) {
          alert("Sua sessão expirou ou o token não foi encontrado.");
          return; 
      }
      
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/expenses/export?month=${monthStr}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/pdf',
            'X-Requested-With': 'XMLHttpRequest'
          }
        }
      );

      if (!response.ok) throw new Error(`Erro ${response.status}`);

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `despesa_${monthStr.replace('-', '_')}.pdf`);
      document.body.appendChild(link);
      link.click();
      
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error("Falha ao exportar:", error);
      alert(`Falha ao exportar o PDF: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-5">
          <p className="text-sm text-muted-foreground">Saldo disponível</p>
          <p className="mt-1 text-3xl font-bold text-primary">R$ {Number(dashboard.balance).toFixed(2)}</p>
          <div className="mt-5 space-y-2">
            {dashboard.payment_methods.map((method) => (
              <button
                key={method.id}
                type="button"
                onClick={() => setMethodToEdit(method)}
                className="flex w-full items-center justify-between rounded-lg bg-muted/50 p-3 text-left hover:bg-muted"
              >
                <span className="flex items-center gap-2"><Wallet className="h-4 w-4" /> {method.name}</span>
                <span>R$ {Number(method.balance).toFixed(2)}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <SummaryCard label={openInvoiceLabel} value={openInvoiceTotal} icon={<CreditCard className="h-5 w-5" />} />
          <SummaryCard label="Débito e boletos" value={summary.debit} icon={<Wallet className="h-5 w-5" />} />
          <SummaryCard label="Depósitos" value={summary.deposit} icon={<Wallet className="h-5 w-5" />} />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-5">
          <h2 className="mb-4 font-semibold text-center md:text-left">Distribuição de Gastos</h2>
          <div className="h-72">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20}}>
                  <Pie 
                    data={chartData} 
                    dataKey="value" 
                    nameKey="name" 
                    cx="50%" 
                    cy="45%" 
                    outerRadius="70%" 
                    label={({ percent }) => `${(percent * 100).toFixed(1)}%`}
                  >
                    {chartData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(value) => `R$ ${Number(value).toFixed(2)}`} />
                  <Legend verticalAlign="bottom" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Nenhum gasto no período selecionado.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <div className="mb-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
            <h2 className="font-semibold text-center md:text-left">Evolução de Gastos</h2>
            <div className="flex rounded-lg bg-muted/50 p-1 text-sm">
              <button
                type="button"
                onClick={() => setEvolutionPeriod("monthly")}
                className={`rounded-md px-3 py-1 transition-all ${
                  evolutionPeriod === "monthly" 
                    ? "bg-background font-medium shadow-sm" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                6 Meses
              </button>
              <button
                type="button"
                onClick={() => setEvolutionPeriod("daily")}
                className={`rounded-md px-3 py-1 transition-all ${
                  evolutionPeriod === "daily" 
                    ? "bg-background font-medium shadow-sm" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                Mês Atual
              </button>
            </div>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={currentEvolutionData} margin={{ top: 8, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" interval={evolutionPeriod === "monthly" ? 0 : "preserveStartEnd"} />
                <YAxis width={80} tickFormatter={(value) => `R$ ${value}`} />
                <Tooltip formatter={(value) => `R$ ${Number(value).toFixed(2)}`} />
                <Legend />
                <Line type="monotone" dataKey="Crédito" stroke="#10b981" strokeWidth={2} dot={evolutionPeriod === "monthly"} />
                <Line type="monotone" dataKey="Débito" stroke="#3b82f6" strokeWidth={2} dot={evolutionPeriod === "monthly"} />
                <Line type="monotone" dataKey="Depósito" stroke="#8b5cf6" strokeWidth={2} dot={evolutionPeriod === "monthly"} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="rounded-xl border bg-card p-5">
        {/* mobile */}
        <div className="flex flex-col gap-4 md:hidden">
          <h2 className="text-center font-semibold text-xl">Movimentações</h2>
          
          <div className="flex items-center justify-between">
            <div className="relative">
              <Button variant="outline" size="icon" className="w-10 h-10">
                <Filter className="h-4 w-4" />
              </Button>
              <select
                value={expenseFilter}
                onChange={(event) => setExpenseFilter(event.target.value)}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              >
                <option value="all">Todos ({expenses.length})</option>
                {Object.entries(expenseLabels).map(([value, label]) => {
                  const count = expenses.filter((e) => e.type === value).length;
                  return (
                    <option key={value} value={value}>
                      {label} ({count})
                    </option>
                  );
                })}
              </select>
            </div>

            <Button 
              variant="outline" 
              size="icon"
              className="w-10 h-10"
              disabled={isExporting}
              onClick={handleExport}
            >
              {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            </Button>
          </div>

          <div className="flex justify-center">
            <MonthSelector
              selectedMonth={selectedMonth}
              onMonthChange={onMonthChange}
            />
          </div>
        </div>

        {/* desktop */}
        <div className="hidden md:flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-xl">Movimentações</h2>
            <MonthSelector
              selectedMonth={selectedMonth}
              onMonthChange={onMonthChange}
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <select
                value={expenseFilter}
                onChange={(event) => setExpenseFilter(event.target.value)}
                className="w-fit rounded-md border bg-background px-3 py-2 text-sm pr-8"
              >
                <option value="all">Todos os tipos ({expenses.length})</option>
                {Object.entries(expenseLabels).map(([value, label]) => {
                  const count = expenses.filter((e) => e.type === value).length;
                  return (
                    <option key={value} value={value}>
                      {label} ({count})
                    </option>
                  );
                })}
              </select>
            </div>
            <Button 
              variant="outline" 
              className="gap-2"
              disabled={isExporting}
              onClick={handleExport}
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Exportando...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" /> Exportar PDF
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="w-full mt-6">
          <ExpenseList
            expenses={expenses}
            filterType={expenseFilter}
            onEdit={onEditExpense}
            onDelete={onDeleteExpense}
          />
        </div>
      </section>

      <UpdateBalanceDialog
        open={Boolean(methodToEdit)}
        onOpenChange={(open) => !open && setMethodToEdit(null)}
        currentBalance={methodToEdit?.balance ?? 0}
        selectedMethodId={methodToEdit?.id}
        onUpdateBalance={onUpdateBalance}
        paymentMethods={dashboard.payment_methods}
      />
    </div>
  );
}

function SummaryCard({ label, value, icon }) {
  return (
    <div className="rounded-xl border bg-muted/40 p-4">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        {label} {icon}
      </div>
      <p className="mt-2 text-xl font-bold">R$ {Number(value).toFixed(2)}</p>
    </div>
  );
}

export default Dashboard;