import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Layout from "@/components/Layout";
import { api, clearSession, saveSession } from "@/lib/api";

function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    api("/me")
      .then((response) => setProfile(response.data))
      .catch((error) => window.alert(error.message));
  }, []);

  const saveProfile = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const password = formData.get("password");
    const confirmation = formData.get("password_confirmation");
    if (password && password !== confirmation) {
      window.alert("A confirmação de senha não confere.");
      return;
    }

    try {
      const response = await api("/me", {
        method: "PATCH",
        body: JSON.stringify({
          username: formData.get("username"),
          email: formData.get("email"),
          ...(password ? { password, password_confirmation: confirmation } : {}),
          ...(password ? { current_password: formData.get("current_password") } : {}),
        }),
      });
      setProfile(response.data);
      saveSession({ token: sessionStorage.getItem("financas.auth_token"), user: response.data });
      window.alert("Perfil atualizado com sucesso.");
    } catch (error) {
      window.alert(error.message);
    }
  };

  const deleteAccount = async () => {
    if (!window.confirm("Excluir sua conta e todos os dados financeiros? Esta ação é irreversível.")) return;
    try {
      await api("/me", { method: "DELETE" });
      clearSession();
      navigate("/login");
    } catch (error) {
      window.alert(error.message);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-primary/20 to-muted px-4 py-10">
        <form onSubmit={saveProfile} className="mx-auto max-w-xl space-y-5 rounded-2xl border bg-card p-8 shadow-xl">
          <div>
            <h1 className="text-3xl font-bold">Perfil</h1>
            <p className="text-sm text-muted-foreground">Atualize seus dados ou senha.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">Nome de usuário</Label>
            <Input id="username" name="username" defaultValue={profile?.username} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" name="email" type="email" defaultValue={profile?.email} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="current_password">Senha atual</Label>
            <Input id="current_password" name="current_password" type="password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Nova senha (opcional)</Label>
            <Input id="password" name="password" type="password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password_confirmation">Confirmar nova senha</Label>
            <Input id="password_confirmation" name="password_confirmation" type="password" />
          </div>
          <Button className="w-full" type="submit">Salvar perfil</Button>
          <Button className="w-full" variant="destructive" type="button" onClick={deleteAccount}>Excluir conta</Button>
        </form>
      </div>
    </Layout>
  );
}

export default Profile;
