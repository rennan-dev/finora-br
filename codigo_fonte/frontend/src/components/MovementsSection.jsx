import React, { useMemo, useState } from "react";
import { format } from "date-fns";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import ExpenseList from "@/components/ExpenseList";
import FilterPopover from "@/components/FilterPopover";
import MonthSelector from "@/components/MonthSelector";

/**
 * Lista de movimentações do mês selecionado, com filtros e exportação em PDF.
 * É o bloco principal da aba "Compras".
 */
function MovementsSection({ expenses, paymentMethods, selectedMonth, onMonthChange, onEdit, onDelete, onMarkAsPaid }) {
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedAccounts, setSelectedAccounts] = useState([]);
  const [isExporting, setIsExporting] = useState(false);

  const filteredCount = useMemo(() => {
    return expenses.filter((expense) => {
      const matchType = selectedTypes.length === 0 || selectedTypes.includes(expense.type);
      const matchAccount = selectedAccounts.length === 0 || selectedAccounts.includes(String(expense.payment_method?.id));
      return matchType && matchAccount;
    }).length;
  }, [expenses, selectedTypes, selectedAccounts]);

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
    <section className="rounded-xl border bg-card p-4 md:p-5">
      {/* mobile */}
      <div className="flex flex-col gap-4 md:hidden">
        <h2 className="text-center font-semibold text-xl">Movimentações</h2>

        <div className="flex items-center justify-between">
          <FilterPopover
            expenses={expenses}
            paymentMethods={paymentMethods}
            selectedTypes={selectedTypes}
            selectedAccounts={selectedAccounts}
            onTypesChange={setSelectedTypes}
            onAccountsChange={setSelectedAccounts}
            filteredCount={filteredCount}
          />

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
          <FilterPopover
            expenses={expenses}
            paymentMethods={paymentMethods}
            selectedTypes={selectedTypes}
            selectedAccounts={selectedAccounts}
            onTypesChange={setSelectedTypes}
            onAccountsChange={setSelectedAccounts}
            filteredCount={filteredCount}
          />

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
          selectedTypes={selectedTypes}
          selectedAccounts={selectedAccounts}
          onEdit={onEdit}
          onDelete={onDelete}
          onMarkAsPaid={onMarkAsPaid}
        />
      </div>
    </section>
  );
}

export default MovementsSection;
