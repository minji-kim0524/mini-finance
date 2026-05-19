import { GetStripe } from "@/lib/stripe";
import { GetSupabaseAdmin } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import type Stripe from "stripe";

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) return NextResponse.json({ error: "No signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = GetStripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.user_id;
    const customerId = session.customer as string;
    const subscriptionId = session.subscription as string;

    if (!userId) return NextResponse.json({ error: "No user_id" }, { status: 400 });

    await GetSupabaseAdmin().from("subscriptions").upsert({
      user_id: userId,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      plan: "pro",
      status: "active",
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
  }

  if (event.type === "customer.subscription.updated") {
    const subscription = event.data.object as Stripe.Subscription;
    const userId = subscription.metadata?.user_id;
    if (!userId) return NextResponse.json({ ok: true });

    const isActive = subscription.status === "active" || subscription.status === "trialing";
    await GetSupabaseAdmin().from("subscriptions").upsert({
      user_id: userId,
      stripe_customer_id: subscription.customer as string,
      stripe_subscription_id: subscription.id,
      plan: isActive ? "pro" : "free",
      status: subscription.status,
      current_period_end: new Date((subscription as unknown as { current_period_end: number }).current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;
    const userId = subscription.metadata?.user_id;
    if (!userId) return NextResponse.json({ ok: true });

    await GetSupabaseAdmin().from("subscriptions").upsert({
      user_id: userId,
      plan: "free",
      status: "canceled",
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
  }

  return NextResponse.json({ ok: true });
}
