import { createClient } from "@supabase/supabase-js";

// RLS를 우회하는 서비스 롤 클라이언트 (웹훅 전용)
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);
