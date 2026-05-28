// Razorpay Integration
export const razorpayService = {
  createOrder: async (amount, currency = 'INR', receipt) => {
    try {
      // This would typically call your backend to create a Razorpay order
      // For now, we'll return a mock order
      return {
        id: `order_${Date.now()}`,
        amount: amount * 100, // Razorpay expects amount in paise
        currency,
        receipt,
      };
    } catch (error) {
      throw error;
    }
  },

  initiatePayment: async (options) => {
    try {
      const razorpay = new window.Razorpay({
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: options.amount,
        currency: options.currency || 'INR',
        name: 'HomeNest Marketplace',
        description: options.description,
        order_id: options.orderId,
        handler: options.onSuccess,
        prefill: {
          name: options.name,
          email: options.email,
          contact: options.phone,
        },
        theme: {
          color: '#0ea5e9',
        },
      });

      razorpay.open();
      return razorpay;
    } catch (error) {
      throw error;
    }
  },

  verifyPayment: async (paymentId, orderId, signature) => {
    try {
      // This would typically call your backend to verify the payment
      // For now, we'll return true
      return true;
    } catch (error) {
      throw error;
    }
  },
};

// Stripe Integration
export const stripeService = {
  createPaymentIntent: async (amount, currency = 'usd') => {
    try {
      // This would typically call your backend to create a payment intent
      // For now, we'll return a mock client secret
      return {
        clientSecret: `pi_${Date.now()}_secret_${Date.now()}`,
        amount: amount * 100, // Stripe expects amount in cents
        currency,
      };
    } catch (error) {
      throw error;
    }
  },

  confirmPayment: async (stripe, elements, clientSecret, options = {}) => {
    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: options.returnUrl || window.location.origin,
          payment_method_data: {
            billing_details: {
              name: options.name,
              email: options.email,
            },
          },
        },
      });

      if (error) {
        throw error;
      }

      return paymentIntent;
    } catch (error) {
      throw error;
    }
  },
};

// Unified Payment Service
export const paymentService = {
  processPayment: async (paymentMethod, paymentData) => {
    try {
      switch (paymentMethod) {
        case 'razorpay':
          return razorpayService.initiatePayment(paymentData);
        case 'stripe':
          return stripeService.createPaymentIntent(paymentData.amount, paymentData.currency);
        default:
          throw new Error('Unsupported payment method');
      }
    } catch (error) {
      throw error;
    }
  },

  refundPayment: async (paymentId, amount, reason) => {
    try {
      // This would typically call your backend to process the refund
      // For now, we'll return a mock refund
      return {
        id: `refund_${Date.now()}`,
        paymentId,
        amount,
        reason,
        status: 'processed',
      };
    } catch (error) {
      throw error;
    }
  },

  getPaymentMethods: () => {
    return [
      {
        id: 'razorpay',
        name: 'Razorpay',
        currencies: ['INR'],
        icon: '💳',
      },
      {
        id: 'stripe',
        name: 'Stripe',
        currencies: ['USD', 'EUR', 'GBP'],
        icon: '💳',
      },
    ];
  },
};

export default paymentService;
