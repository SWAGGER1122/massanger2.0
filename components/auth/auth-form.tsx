"use client";

import { FormEvent, useState } from "react";
import { Loader2, LogIn, Phone, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { signInWithEmail, signInWithPhone, signUpWithEmail } from "@/lib/supabase/auth";

type AuthMode = "login" | "register" | "phone";

export function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    if (mode === "login") {
      const { error } = await signInWithEmail(email.trim(), password);
      if (error) {
        setMessage(error.message);
      } else {
        router.replace("/chats");
      }
      setLoading(false);
      return;
    }

    if (mode === "register") {
      const { error } = await signUpWithEmail(email.trim(), password);
      setMessage(error ? error.message : "Проверьте почту для подтверждения регистрации");
      setLoading(false);
      return;
    }

    const { error } = await signInWithPhone(phone.trim());
    setMessage(error ? error.message : "Код отправлен на телефон");
    setLoading(false);
  }

  return (
    <div className="glass-panel w-full max-w-md rounded-3xl p-6">
      <h1 className="text-2xl font-semibold">Вход в Messenger</h1>
      <p className="mt-1 text-sm text-zinc-400">Авторизация через Supabase Auth</p>

      <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl border border-white/10 bg-white/5 p-1">
        <button
          onClick={() => setMode("login")}
          className={`rounded-xl px-3 py-2 text-xs transition ${mode === "login" ? "bg-sky-500 text-white" : "text-zinc-300"}`}
        >
          Вход
        </button>
        <button
          onClick={() => setMode("register")}
          className={`rounded-xl px-3 py-2 text-xs transition ${mode === "register" ? "bg-sky-500 text-white" : "text-zinc-300"}`}
        >
          Регистрация
        </button>
        <button
          onClick={() => setMode("phone")}
          className={`rounded-xl px-3 py-2 text-xs transition ${mode === "phone" ? "bg-sky-500 text-white" : "text-zinc-300"}`}
        >
          Телефон
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        {mode !== "phone" ? (
          <>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm outline-none placeholder:text-zinc-500"
              required
            />
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Пароль"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm outline-none placeholder:text-zinc-500"
              required
            />
          </>
        ) : (
          <input
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="+79991112233"
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm outline-none placeholder:text-zinc-500"
            required
          />
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-400 disabled:opacity-70"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : null}
          {mode === "login" ? <LogIn size={16} /> : mode === "register" ? <UserPlus size={16} /> : <Phone size={16} />}
          {mode === "login" ? "Войти" : mode === "register" ? "Создать аккаунт" : "Получить код"}
        </button>
      </form>

      {message ? <p className="mt-3 text-sm text-zinc-300">{message}</p> : null}
    </div>
  );
}
