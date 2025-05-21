import Stripe from "stripe";

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY);

export function isTestMode() {
  return import.meta.env.STRIPE_SECRET_KEY.startsWith("sk_test_");
}

export async function createCheckoutSession(
  params: Stripe.Checkout.SessionCreateParams,
): Promise<Stripe.Checkout.Session | null> {
  try {
    return await stripe.checkout.sessions.create(params);
  } catch (error) {
    console.error("Error creating checkout session:", error);
    // Return `null` or rethrow, depending on your use case
    return null;
  }
}

export async function createCustomer(
  params: Stripe.CustomerCreateParams,
): Promise<Stripe.Customer | null> {
  try {
    const customer = await stripe.customers.create(params);

    console.log(`Customer created: ${customer.id}`);
    return customer;
  } catch (error) {
    console.error("Error creating customer:", error);
    return null;
  }
}

export async function updateCustomer(
  customerId: string,
  params: Stripe.CustomerUpdateParams,
): Promise<Stripe.Customer | null> {
  try {
    const customer = await stripe.customers.update(customerId, params);

    console.log(`Customer updated: ${customer.id}`);
    return customer;
  } catch (error) {
    console.error("Error updating customer:", error);
    return null;
  }
}

export async function getCustomerByEmail(
  email: string,
): Promise<Stripe.Customer | null> {
  try {
    const response = await stripe.customers.list({
      email,
      limit: 1,
    });

    const customer = response.data[0] || null;

    if (customer) {
      console.log(`Customer found: ${customer.id}`);
    } else {
      console.warn(`No customer found for email: ${email}`);
    }

    return customer;
  } catch (error) {
    console.error(`Error fetching customer by email: ${email}`, error);
    throw new Error(`Failed to retrieve customer for email: ${email}`);
  }
}

export const createBillingPortalSession = async (
  customerId: string,
  returnUrl: string,
): Promise<string> => {
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return session.url;
  } catch (error) {
    console.error("Error creating billing portal session:", error);
    throw new Error("Unable to create billing portal session.");
  }
};
