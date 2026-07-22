import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Filter, X } from "lucide-react";
import { expenseLabels } from "@/components/ExpenseList";

function FilterPopover({ 
  expenses, 
  paymentMethods, 
  selectedTypes, 
  selectedAccounts, 
  onTypesChange, 
  onAccountsChange,
  filteredCount 
}) {
  const [open, setOpen] = useState(false);

  const toggleType = (type) => {
    if (type === "all") {
      onTypesChange([]);
      return;
    }
    const newTypes = selectedTypes.includes(type)
      ? selectedTypes.filter((t) => t !== type)
      : [...selectedTypes, type];
    onTypesChange(newTypes);
  };

  const toggleAccount = (accountId) => {
    if (accountId === "all") {
      onAccountsChange([]);
      return;
    }
    const newAccounts = selectedAccounts.includes(accountId)
      ? selectedAccounts.filter((id) => id !== accountId)
      : [...selectedAccounts, accountId];
    onAccountsChange(newAccounts);
  };

  const clearFilters = () => {
    onTypesChange([]);
    onAccountsChange([]);
  };

  const hasActiveFilters = selectedTypes.length > 0 || selectedAccounts.length > 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="relative flex items-center gap-2 px-3">
          <Filter className="h-4 w-4" />
          <span>({filteredCount})</span>
          {hasActiveFilters && (
            <span className="absolute -right-1 -top-1 flex h-3 w-3 rounded-full bg-primary" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Filtros</h4>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-auto p-1 text-xs">
                <X className="mr-1 h-3 w-3" /> Limpar
              </Button>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Tipos de Transação</Label>
            <div className="max-h-48 space-y-2 overflow-y-auto rounded-md border p-2">
              {Object.entries(expenseLabels).map(([value, label]) => (
                <div key={value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`type-${value}`}
                    checked={selectedTypes.includes(value)}
                    onCheckedChange={() => toggleType(value)}
                  />
                  <Label htmlFor={`type-${value}`} className="text-sm font-normal cursor-pointer">
                    {label} ({expenses.filter((e) => e.type === value).length})
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Contas</Label>
            <div className="max-h-48 space-y-2 overflow-y-auto rounded-md border p-2">
              {paymentMethods.map((method) => (
                <div key={method.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`account-${method.id}`}
                    checked={selectedAccounts.includes(String(method.id))}
                    onCheckedChange={() => toggleAccount(String(method.id))}
                  />
                  <Label htmlFor={`account-${method.id}`} className="text-sm font-normal cursor-pointer">
                    {method.name} ({expenses.filter((e) => String(e.payment_method?.id) === String(method.id)).length})
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default FilterPopover;