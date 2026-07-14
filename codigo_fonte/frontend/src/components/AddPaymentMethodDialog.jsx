import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

function AddPaymentMethodDialog({ open, onOpenChange, onAddPaymentMethod }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    onAddPaymentMethod({
      name: formData.get("name"),
      balance: Number(formData.get("balance") || 0),
      is_favorite: formData.get("is_favorite") === "on",
    });
    e.target.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]" aria-describedby="add-payment-method-description">
        <DialogHeader>
          <DialogTitle>Adicionar Método de Pagamento</DialogTitle>
        </DialogHeader>
        <p id="add-payment-method-description" className="text-sm text-muted-foreground">
          Informe o saldo inicial e, se desejar, defina como favorito global.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Método</Label>
            <Input
              id="name"
              name="name"
              required
              placeholder="Ex: Conta Nubank"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="balance">Saldo inicial</Label>
            <Input id="balance" name="balance" type="number" step="0.01" defaultValue="0" />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <Input id="is_favorite" name="is_favorite" type="checkbox" className="h-4 w-4" />
            Usar como método favorito
          </label>

          <Button type="submit" className="w-full">
            Adicionar Método
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default AddPaymentMethodDialog;