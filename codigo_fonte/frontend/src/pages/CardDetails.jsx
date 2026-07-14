import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";
import ExpenseList from "@/components/ExpenseList";
import MonthSelector from "@/components/MonthSelector";
import { api } from "@/lib/api";

function CardDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [month, setMonth] = useState(new Date());
  const [invoice, setInvoice] = useState(null);
  const [expenses, setExpenses] = useState([]);

  const loadInvoice = useCallback(async () => {
    const response = await api(
      `/invoices?payment_method_id=${id}&reference_month=${month.getMonth() + 1}&reference_year=${month.getFullYear()}`
    );
    const currentInvoice = response.data[0] || null;
    setInvoice(currentInvoice);

    if (currentInvoice) {
      const details = await api(`/invoices/${currentInvoice.id}`);
      setExpenses(details.data.expenses.data);
    } else {
      setExpenses([]);
    }
  }, [id, month]);

  useEffect(() => {
    loadInvoice().catch((error) => console.error(error));
  }, [loadInvoice]);

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-primary/20 to-muted px-4 py-8">
        <div className="mx-auto max-w-5xl space-y-6">
          <Button variant="ghost" onClick={() => navigate("/cards")} className="gap-2">
            <ArrowLeft className="h-5 w-5" /> Voltar para cartões
          </Button>
          <section className="rounded-xl border bg-card p-6">
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-bold">{invoice?.payment_method?.name || "Fatura do cartão"}</h1>
                <p className="text-muted-foreground">Compras agrupadas pelo mês da fatura.</p>
              </div>
              <MonthSelector selectedMonth={month} onMonthChange={setMonth} />
            </div>
            <div className="mb-6 rounded-lg bg-muted p-4">
              <p className="text-sm text-muted-foreground">Total da fatura</p>
              <p className="text-2xl font-bold">R$ {Number(invoice?.total_amount || 0).toFixed(2)}</p>
            </div>
            <ExpenseList expenses={expenses} />
          </section>
        </div>
      </div>
    </Layout>
  );
}

export default CardDetails;
