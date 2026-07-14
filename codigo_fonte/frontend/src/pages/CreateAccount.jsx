import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, saveSession } from "@/lib/api";

function CreateAccount() {
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const username = formData.get("username");
    const email = formData.get("email");
    const password = formData.get("password");
    const confirmPassword = formData.get("confirmPassword");

    if (password !== confirmPassword) {
      window.alert("Erro: As senhas não coincidem");
      return;
    }

    if (!username || !email || !password) {
      window.alert("Erro: Por favor, preencha todos os campos");
      return;
    }

    try {
      const response = await api("/register", {
        method: "POST",
        body: JSON.stringify({
          username,
          email,
          password,
          password_confirmation: confirmPassword,
        }),
      });
      saveSession({
        user: response.data.user,
        token: response.data.token.plain_text_token,
      });
      navigate("/home");
    } catch (error) {
      console.error("Erro ao criar conta:", error);
      window.alert("Erro: Ocorreu um erro ao criar a conta.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 to-muted px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md p-8 rounded-2xl bg-card/90 shadow-xl backdrop-blur-md border border-border space-y-6"
      >
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Criar Conta 📝</h1>
          <p className="text-muted-foreground text-sm">
            Comece a gerenciar suas finanças com facilidade
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Nome de usuário</Label>
            <Input id="username" name="username" placeholder="seu_usuario" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="seu@email.com" required />
          </div>
          <div className="space-y-2">
  <Label htmlFor="password">Senha</Label>
  <Input id="password" name="password" type="password" required />
  <small className="text-xs text-muted-foreground">
    Use ao menos 12 caracteres, letras maiúsculas/minúsculas, números e símbolos.
  </small>
</div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Senha</Label>
            <Input id="confirmPassword" name="confirmPassword" type="password" required />
          </div>
          <Button type="submit" className="w-full transition-transform hover:scale-105">
            Criar Conta
          </Button>
        </form>

        <div className="text-center text-sm text-muted-foreground">
          Já tem uma conta?{" "}
          <Link to="/login" className="text-primary hover:underline">
            Entrar
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

export default CreateAccount;
