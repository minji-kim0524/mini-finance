"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  async function handleLogin() {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/dashboard");
  }

  async function handleSignup() {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setError(error.message);
      return;
    }
    setError("이메일을 확인해주세요 ✓");
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <section className="w-80 space-y-4">
        <h1 className="text-xl font-bold">재무 대시보드</h1>
        <input
          type="email"
          placeholder="이메일"
          className="w-full border rounded px-3 py-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="비밀번호"
          className="w-full border rounded px-3 py-2"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          onClick={handleLogin}
          className="w-full bg-blue-600 text-white py-2 rounded"
        >
          로그인
        </button>
        <button
          onClick={handleSignup}
          className="w-full border py-2 rounded text-sm"
        >
          회원가입
        </button>
      </section>
    </div>
  );
}
