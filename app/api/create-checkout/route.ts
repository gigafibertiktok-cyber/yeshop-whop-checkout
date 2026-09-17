import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { cart } = body;

    if (!cart || !cart.total_price) {
      return NextResponse.json({ error: "No cart data" }, { status: 400 });
    }

    const total = cart.total_price / 100; // Shopify uses cents

    // Create Whop checkout configuration
    const response = await fetch("https://api.whop.com/api/v1/checkout_configurations", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.WHOP_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        plan: {
          initial_price: total,
          plan_type: "one_time",
          currency: "usd",
        },
        metadata: {
          shopify_cart: JSON.stringify(cart),
          source: "shopify",
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Whop error:", data);
      return NextResponse.json({ error: "Failed to create checkout" }, { status: 500 });
    }

    // Return the Whop checkout URL
    return NextResponse.json({
      checkoutUrl: data.purchase_url || `https://whop.com/checkout/${data.id}`,
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
