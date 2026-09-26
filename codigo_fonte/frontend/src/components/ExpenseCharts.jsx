import React, { useMemo, useState } from "react";
import {
  CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import MonthSelector from "@/components/MonthSelector";

/**
 * Gráficos existentes (distribuição de gastos e evolução) isolados na aba
 * "Gráficos" da navegação mobile.
 */
function ExpenseCharts({ summary, evolution, selectedMonth, onMonthChange }) {
  const [evolutionPeriod, setEvolutionPeriod] = useState("monthly");

  const chartData = [
    { name: "Crédito", value: summary.credit, color: "#10b981" },
    { name: "Débito", value: summary.debit, color: "#3b82f6" },
    { name: "Depósito", value: summary.deposit, color: "#8b5cf6" },
  ].filter((entry) => entry.value > 0);

  const currentEvolutionData = useMemo(() => {
    if (evolution?.[evolutionPeriod]) {
      return evolution[evolutionPeriod];
    }

    if (evolution?.data?.[evolutionPeriod]) {
      return evolution.data[evolutionPeriod];
    }

    if (Array.isArray(evolution)) {
      return evolutionPeriod === "monthly" ? evolution : [];
    }

    return [];
  }, [evolution, evolutionPeriod]);

  return (
    <div className="space-y-6">
      <div className="flex justify-center md:justify-start">
        <MonthSelector selectedMonth={selectedMonth} onMonthChange={onMonthChange} />
      </div>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-5">
          <h2 className="mb-4 font-semibold text-center md:text-left">Distribuição de Gastos</h2>
          <div className="h-72">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
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
    </div>
  );
}

export default ExpenseCharts;
