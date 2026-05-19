// 브라우저용
import { createBrowserClient } from "@supabase/ssr";

export function CreateClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
