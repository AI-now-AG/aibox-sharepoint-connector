import Stripe from "stripe";

type SessionCreateParams = Stripe.Checkout.SessionCreateParams;

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY);

export async function createCheckoutSession(
  params: SessionCreateParams,
): Promise<Stripe.Checkout.Session | null> {
  try {
    const session = await stripe.checkout.sessions.create(params);
    return session;
  } catch (error) {
    console.error("Error creating checkout session:", error);
    // Return `null` or rethrow, depending on your use case
    return null;
  }
}

export async function createCustomer(
  email: string,
  customerData?: {
    name?: string;
    phone?: string;
    address?: Stripe.AddressParam;
  },
): Promise<Stripe.Customer | null> {
  try {
    const customer = await stripe.customers.create({
      email,
      name: customerData?.name,
      phone: customerData?.phone,
      address: customerData?.address,
    });

    console.log(`Customer created: ${customer.id}`);
    return customer;
  } catch (error) {
    console.error("Error creating customer:", error);
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
