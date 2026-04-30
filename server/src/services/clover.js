import { config, getCloverBaseUrl } from '../config.js';

/**
 * Creates a Clover Hosted Checkout session.
 * This keeps your app out of PCI-card-data territory because the customer pays
 * on Clover's hosted page instead of your custom form collecting card numbers.
 */
export async function createHostedCheckoutSession({ order, customer, items }) {
  if (!config.clover.merchantId || !config.clover.privateToken) {
    const error = new Error('Clover credentials are missing. Set CLOVER_MERCHANT_ID and CLOVER_PRIVATE_TOKEN.');
    error.statusCode = 500;
    throw error;
  }

  const url = `${getCloverBaseUrl()}/invoicingcheckoutservice/v1/checkouts`;

  const payload = {
    customer: {
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      phoneNumber: customer.phone || undefined
    },
    tips: {
      enabled: true
    },
    shoppingCart: {
      lineItems: items.map((item) => ({
        name: item.name,
        price: item.priceCents,
        unitQty: item.quantity,
        note: [item.note, order.order_comment && `Order note: ${order.order_comment}`, `Pickup: ${order.pickup_time_iso}`]
          .filter(Boolean)
          .join(' | ')
      }))
    },
    redirectUrls: {
      success: `${config.appBaseUrl}/order/success?session_id={CHECKOUT_SESSION_ID}`,
      failure: `${config.appBaseUrl}/order/failure?error_code={ERROR_CODE}`
    }
  };

  // pageConfigUuid lets a merchant use a custom branded Hosted Checkout page.
  if (config.clover.pageConfigUuid) {
    payload.pageConfigUuid = config.clover.pageConfigUuid;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'X-Clover-Merchant-Id': config.clover.merchantId,
      authorization: `Bearer ${config.clover.privateToken}`
    },
    body: JSON.stringify(payload)
  });

  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  if (!response.ok) {
    const error = new Error('Clover checkout session failed. Check token permissions, merchant ID, and request body.');
    error.statusCode = 502;
    error.publicMessage = 'Payment setup failed. Please try again or contact the store.';
    error.cloverResponse = data;
    console.error('[clover-checkout-error]', data);
    throw error;
  }

  return {
    checkoutUrl: data.href,
    checkoutSessionId: data.checkoutSessionId,
    raw: data
  };
}
