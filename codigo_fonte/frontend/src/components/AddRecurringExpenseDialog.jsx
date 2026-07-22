import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function AddRecurringExpenseDialog({
  open,
  onOpenChange,
  onAddRecurringExpense,
  paymentMethods,
}) {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = React.useState("");
  const compatibleMethods = paymentMethods;

  React.useEffect(() => {
    if (!open) return;
    if (selectedPaymentMethod) return;

    const favorite = compatibleMethods.find((method) => method.is_favorite);
    setSelectedPaymentMethod(favorite ? favorite.id.toString() : "");
  }, [open, compatibleMethods]);

  const handleSubmit = (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const payload = {
      description: formData.get("description"),
      amount: parseFloat(formData.get("amount")),
      payment_method_id: Number(selectedPaymentMethod),
    };

    onAddRecurringExpense(payload);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]" aria-describedby="add-recurring-description">
        <DialogHeader>
          <DialogTitle>Nova Despesa Fixa</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Input
              id="description"
              name="description"
              required
              placeholder="Ex: Netflix, Aluguel, Internet..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Valor</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              step="0.01"
              required
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentMethod">Método de Pagamento</Label>
            <Select
              value={selectedPaymentMethod}
              onValueChange={setSelectedPaymentMethod}
              required
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione um método" />
              </SelectTrigger>
              <SelectContent>
                {compatibleMethods.map((method) => (
                  <SelectItem key={method.id} value={method.id.toString()}>
                    {method.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Como funciona</p>
            <ul className="mt-1 list-inside list-disc space-y-1">
              <li>A despesa será gerada no <strong>dia 1 de cada mês</strong></li>
              <li>Ela ficará como <strong>pendente</strong> até você marcar como paga</li>
              <li>Ao marcar como paga, o valor será debitado do saldo</li>
              <li>As despesas já geradas em meses anteriores não são afetadas</li>
            </ul>
          </div>

          <Button type="submit" className="w-full">
            Criar Despesa Fixa
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default AddRecurringExpenseDialog;