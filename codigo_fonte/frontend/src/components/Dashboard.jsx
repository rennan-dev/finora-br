import React, { useMemo, useState } from "react";
import { CreditCard, Wallet } from "lucide-react";
import {
  CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import ExpenseList from "@/components/ExpenseList";
import MonthSelector from "@/components/MonthSelector";
import UpdateBalanceDialog from "@/components/UpdateBalanceDialog";

function Dashboard({ 
  expenses, dashboard, summary, evolution, 
  onUpdateBalance, onEditExpense, onDeleteExpense, selectedMonth, onMonthChange 
}) {
  const [methodToEdit, setMethodToEdit] = useState(null);

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
          <h2 className="mb-4 font-semibold">Distribuição de Gastos</h2>
          <div className="h-72">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={chartData} 
                    dataKey="value" 
                    nameKey="name" 
                    cx="50%" 
                    cy="45%" 
                    outerRadius="75%" 
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
          <h2 className="mb-4 font-semibold">Evolução de Gastos</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={evolution} margin={{ top: 8, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis width={80} tickFormatter={(value) => `R$ ${value}`} />
                <Tooltip formatter={(value) => `R$ ${Number(value).toFixed(2)}`} />
                <Legend />
                <Line type="monotone" dataKey="Crédito" stroke="#10b981" strokeWidth={2} />
                <Line type="monotone" dataKey="Débito" stroke="#3b82f6" strokeWidth={2} />
                <Line type="monotone" dataKey="Depósito" stroke="#8b5cf6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="rounded-xl border bg-card p-5">
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-semibold">Movimentações</h2>
          </div>
          <MonthSelector selectedMonth={selectedMonth} onMonthChange={onMonthChange} />
        </div>
        <ExpenseList expenses={expenses} onEdit={onEditExpense} onDelete={onDeleteExpense} />
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