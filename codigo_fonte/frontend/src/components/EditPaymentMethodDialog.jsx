import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function EditPaymentMethodDialog({ open, onOpenChange, paymentMethod, onSave }) {
  const handleSubmit = (event) => {
    event.preventDefault();
    if (!paymentMethod) return;

    const formData = new FormData(event.currentTarget);
    onSave(paymentMethod.id, {
      name: formData.get("name"),
      balance: Number(formData.get("balance")),
      is_favorite: formData.get("is_favorite") === "on",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader><DialogTitle>Editar cartão ou conta</DialogTitle></DialogHeader>
        <form key={paymentMethod?.id} onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-method-name">Nome</Label>
            <Input id="edit-method-name" name="name" defaultValue={paymentMethod?.name} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-method-balance">Saldo</Label>
            <Input id="edit-method-balance" name="balance" type="number" step="0.01" defaultValue={paymentMethod?.balance} required />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Input name="is_favorite" type="checkbox" defaultChecked={paymentMethod?.is_favorite} className="h-4 w-4" />
            Usar como método favorito
          </label>
          <Button type="submit" className="w-full">Salvar alterações</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default EditPaymentMethodDialog;
