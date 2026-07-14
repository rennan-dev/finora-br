import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserCircle } from "lucide-react";
import { api, clearSession, getStoredUser } from "@/lib/api";

function Layout({ children }) {
  const navigate = useNavigate();
  const user = getStoredUser() || {};

  const handleLogout = async () => {
    try {
      await api("/logout", {
        method: "POST",
      });
    } catch (error) {
      console.error("Erro ao efetuar logout:", error);
    } finally {
      clearSession();
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <h1
            className="text-2xl font-bold text-primary cursor-pointer"
            onClick={() => navigate("/home")}
          >
            Finora BR
          </h1>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2">
              <UserCircle className="h-6 w-6" />
              <span className="hidden sm:inline">{user.username || user.email}</span>
            </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate("/profile")}>
                Perfil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/cards")}>
                Cartões
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout}>
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t py-4">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © 2025 Rennan Alves. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}

export default Layout;
