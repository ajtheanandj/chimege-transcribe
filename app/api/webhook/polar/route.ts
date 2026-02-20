import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const event = body.type;

    // Verify webhook signature in production
    // const signature = request.headers.get("webhook-signature");

    switch (event) {
      case "checkout.created": {
        console.log("Polar checkout created:", body.data?.id);
        break;
      }
      case "subscription.created": {
        const subscription = body.data;
        console.log(
          "New subscription:",
          subscription?.id,
          "for",
          subscription?.customer_email,
        );
        // TODO: Link subscription to user in database
        // Update user's plan/credits based on subscription tier
        break;
      }
      case "subscription.updated": {
        const subscription = body.data;
        console.log("Subscription updated:", subscription?.id);
        break;
      }
      case "subscription.canceled": {
        const subscription = body.data;
        console.log("Subscription canceled:", subscription?.id);
        // TODO: Downgrade user to free tier
        break;
      }
      case "order.created": {
        const order = body.data;
        console.log("Order created:", order?.id);
        // TODO: Credit minutes for pay-per-use purchases
        break;
      }
      default:
        console.log("Unhandled Polar webhook event:", event);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Polar webhook error:", err);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 },
    );
  }
}
