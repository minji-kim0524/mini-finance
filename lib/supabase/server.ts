// 서버용 (API Route, Server Components)
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { cache } from "react";

export async function CreateClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Component에서 호출된 경우 무시 — 세션 갱신은 middleware가 처리
          }
        },
      },
    },
  );
}

// 같은 요청 안에서 여러 Server Component가 호출해도 네트워크 요청은 1번만 발생
export const GetUser = cache(async () => {
  const supabase = await CreateClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
});

export const GetSubscription = cache(async (userId: string) => {
  const supabase = await CreateClient();
  const { data } = await supabase
    .from("subscriptions")
    .select("plan, stripe_customer_id")
    .eq("user_id", userId)
    .single();
  return data;
});
