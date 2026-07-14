import React, { useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function AddExpenseDialog({
  open,
  onOpenChange,
  onAddExpense,
  paymentMethods,
  title,
  submitLabel = "Realizar Compra",
  paymentType,
}) {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = React.useState("");
  const compatibleMethods = useMemo(
    () => paymentMethods,
    [paymentMethods]
  );
  const today = new Date().toLocaleDateString("en-CA");

  useEffect(() => {
    if (!open) return;

    const favorite = compatibleMethods.find((method) => method.is_favorite);
    setSelectedPaymentMethod(favorite ? favorite.id.toString() : "");
  }, [open, compatibleMethods]);

  const handleSubmit = (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);

    const expense = {
      description: formData.get("description"),
      amount: parseFloat(formData.get("amount")),
      transaction_date: formData.get("transaction_date"),
      payment_method_id: Number(selectedPaymentMethod),
      type: paymentType,
    };

    onAddExpense(expense);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]" aria-describedby="add-expense-description">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Input
              id="description"
              name="description"
              required
              placeholder="Digite a descrição"
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
            <Label htmlFor="date">Data</Label>
            <Input
              id="date"
              name="transaction_date"
              type="date"
              required
              defaultValue={today}
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

          {/* 🔴 agora o texto do botão é dinâmico */}
          <Button type="submit" className="w-full">
            {submitLabel}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default AddExpenseDialog;