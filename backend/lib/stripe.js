import Stripe from "stripe";

let stripeClient = null;

export const getStripeClient = () => {
  if (stripeClient) {
    return stripeClient;
  }

  const secretKey = `${process.env.STRIPE_SECRET_KEY || ""}`.trim();

  if (!secretKey) {
    throw new Error("Stripe secret key is missing");
  }

  stripeClient = new Stripe(secretKey);

  return stripeClient;
};

export const __setStripeClientForTests = (client) => {
  stripeClient = client;
};
