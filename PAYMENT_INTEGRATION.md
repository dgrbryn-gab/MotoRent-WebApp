# Payment Gateway Integration Guide (Stripe)

## 📋 Overview

This guide covers the complete integration of Stripe payment processing into the MotoRent platform, enabling secure online payments for motorcycle rentals.

## 🎯 Features Implemented

### ✅ Payment Service (`paymentService.ts`)
- **Stripe Integration**: Card payments via Stripe
- **Multiple Payment Methods**: Card, GCash, Cash
- **Payment Intents**: Secure payment processing
- **Refund Management**: Full and partial refunds
- **Payment History**: Track all transactions
- **Statistics**: Revenue analytics

### ✅ Database Schema
- **Payments Table**: Comprehensive payment tracking
- **RLS Policies**: Secure data access
- **Indexes**: Optimized queries
- **Analytics Views**: Revenue insights

### ✅ Payment Components
- **CheckoutPage**: Payment processing interface
- **PaymentSuccessPage**: Confirmation and receipt
- **Admin Integration**: Payment management

---

## 📦 Installation

### 1. Install Stripe SDK

```bash
npm install @stripe/stripe-js
```

### 2. Set Up Environment Variables

Create or update `.env` file:

```env
# Stripe Configuration
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
VITE_STRIPE_SECRET_KEY=sk_test_your_secret_key_here
VITE_STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# App Configuration
VITE_APP_URL=http://localhost:5173
```

### 3. Run Database Migration

Apply the payments table migration:

```bash
# Using Supabase CLI
supabase db push

# Or manually run the SQL in Supabase Dashboard
# File: supabase/migrations/004_payments_table.sql
```

---

## 🔧 Stripe Setup

### 1. Create Stripe Account

1. Go to [https://stripe.com](https://stripe.com)
2. Sign up for a free account
3. Complete account verification

### 2. Get API Keys

1. Go to **Developers → API keys**
2. Copy your **Publishable key** (starts with `pk_test_`)
3. Copy your **Secret key** (starts with `sk_test_`)
4. Add them to your `.env` file

### 3. Set Up Webhooks (Optional)

Webhooks notify your app about payment events.

1. Go to **Developers → Webhooks**
2. Click **Add endpoint**
3. Enter your webhook URL: `https://your-domain.com/api/webhooks/stripe`
4. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
5. Copy the **Signing secret** (starts with `whsec_`)
6. Add it to your `.env` file

---

## 💳 Payment Flow

### Customer Flow

```
1. Customer books a motorcycle
   └─> BookingPage creates reservation

2. System creates payment intent
   └─> paymentService.createPaymentIntent()

3. Customer enters payment details
   └─> CheckoutPage (Stripe Elements)

4. Payment is processed
   └─> paymentService.processPayment()

5. Confirmation shown
   └─> PaymentSuccessPage

6. Email notification sent
   └─> emailService.sendBookingConfirmation()
```

### Admin Flow

```
1. View all payments
   └─> AdminPayments page

2. Confirm cash payments
   └─> paymentService.confirmCashPayment()

3. Process refunds
   └─> paymentService.refundPayment()

4. View analytics
   └─> paymentService.getPaymentStatistics()
```

---

## 🧪 Testing

### Test Cards

Stripe provides test cards for different scenarios:

| Card Number          | Scenario                  |
|---------------------|---------------------------|
| `4242 4242 4242 4242` | Successful payment       |
| `4000 0000 0000 9995` | Payment declined         |
| `4000 0025 0000 3155` | Requires authentication  |
| `4000 0000 0000 0069` | Expired card             |

**Test Card Details:**
- Expiry: Any future date (e.g., `12/25`)
- CVC: Any 3 digits (e.g., `123`)
- ZIP: Any 5 digits (e.g., `12345`)

### Testing Payment Flow

```typescript
// 1. Create a test payment
const { payment, clientSecret } = await createPaymentIntent({
  reservationId: 'test-reservation-id',
  userId: 'test-user-id',
  amount: 1000,
  paymentMethod: 'card',
  metadata: {
    motorcycle_name: 'Test Motorcycle',
    test_mode: true,
  },
});

// 2. Process payment
const processedPayment = await processPayment({
  paymentId: payment.id,
  paymentMethodId: 'pm_card_visa', // Stripe test payment method
});

// 3. Check status
console.log(processedPayment.status); // 'succeeded'
```

### Testing Refunds

```typescript
// Process a refund
const refundedPayment = await refundPayment({
  paymentId: 'payment-id',
  amount: 500, // Optional: partial refund
  reason: 'Customer requested refund',
});

console.log(refundedPayment.status); // 'refunded' or 'partially_refunded'
```

---

## 🔐 Security Best Practices

### 1. Never Expose Secret Keys

```typescript
// ❌ WRONG - Don't use secret key in frontend
const stripe = new Stripe(import.meta.env.VITE_STRIPE_SECRET_KEY);

// ✅ CORRECT - Use publishable key in frontend
const stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
```

### 2. Validate Payments Server-Side

Always verify payments on your backend:

```typescript
// Frontend creates payment intent
const { clientSecret } = await fetch('/api/create-payment-intent', {
  method: 'POST',
  body: JSON.stringify({ amount: 1000 }),
});

// Backend verifies with Stripe
const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
if (paymentIntent.status === 'succeeded') {
  // Update database
}
```

### 3. Use Webhook Signatures

```typescript
const sig = request.headers['stripe-signature'];
const event = stripe.webhooks.constructEvent(
  request.body,
  sig,
  process.env.STRIPE_WEBHOOK_SECRET
);
```

---

## 🎨 UI Components

### CheckoutPage

Displays payment options and processes payments:

```tsx
<CheckoutPage />
```

**Features:**
- Multiple payment methods (Card, GCash, Cash)
- Order summary
- Secure card input (Stripe Elements)
- Payment confirmation

### PaymentSuccessPage

Shows payment confirmation:

```tsx
<PaymentSuccessPage />
```

**Features:**
- Payment details
- Booking information
- Receipt download
- Next steps guide

---

## 📊 Payment Service API

### Create Payment Intent

```typescript
const { payment, clientSecret } = await createPaymentIntent({
  reservationId: string,
  userId: string,
  amount: number,
  currency?: string, // Default: 'PHP'
  paymentMethod: 'card' | 'gcash' | 'cash',
  metadata?: Record<string, any>,
});
```

### Process Payment

```typescript
const payment = await processPayment({
  paymentId: string,
  paymentMethodId?: string, // Stripe payment method ID
});
```

### Confirm Cash Payment (Admin)

```typescript
const payment = await confirmCashPayment(paymentId: string);
```

### Refund Payment

```typescript
const payment = await refundPayment({
  paymentId: string,
  amount?: number, // Optional: partial refund
  reason?: string,
});
```

### Get Payment History

```typescript
// User's payments
const payments = await getUserPaymentHistory(userId: string);

// All payments (admin)
const allPayments = await getAllPayments({
  status?: PaymentStatus,
  paymentMethod?: PaymentMethod,
  startDate?: string,
  endDate?: string,
});
```

### Get Statistics

```typescript
const stats = await getPaymentStatistics();
// Returns:
// {
//   total: number,
//   succeeded: number,
//   pending: number,
//   failed: number,
//   refunded: number,
//   totalRevenue: number,
//   byMethod: { card, gcash, cash }
// }
```

---

## 🗄️ Database Schema

### Payments Table

```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY,
  reservation_id UUID REFERENCES reservations(id),
  user_id UUID REFERENCES users(id),
  
  -- Payment details
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'PHP',
  status VARCHAR(50), -- pending, succeeded, failed, refunded, etc.
  payment_method VARCHAR(50), -- card, gcash, cash
  
  -- Stripe integration
  stripe_payment_intent_id VARCHAR(255),
  stripe_charge_id VARCHAR(255),
  stripe_refund_id VARCHAR(255),
  
  -- Refund info
  refund_amount DECIMAL(10, 2),
  refund_reason TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  error_message TEXT,
  
  -- Timestamps
  paid_at TIMESTAMP,
  refunded_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🔧 Troubleshooting

### Payment Intent Creation Fails

**Error:** `Failed to create payment intent`

**Solutions:**
1. Check Stripe API key is correct
2. Verify amount is > 0
3. Check network connection
4. Review Stripe Dashboard for errors

### Payment Confirmation Fails

**Error:** `Your card was declined`

**Solutions:**
1. Use test cards for testing
2. Check card details are correct
3. Try different payment method
4. Check Stripe Dashboard logs

### Webhook Not Receiving Events

**Solutions:**
1. Verify webhook endpoint is accessible
2. Check webhook signature secret
3. Use Stripe CLI for local testing:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

### Database Permission Errors

**Error:** `new row violates row-level security policy`

**Solutions:**
1. Check RLS policies are correctly configured
2. Verify user is authenticated
3. Review migration file for missing policies

---

## 📈 Analytics & Reporting

### Revenue Dashboard

```typescript
// Get total revenue
const revenue = await getTotalRevenue({
  startDate: '2025-01-01',
  endDate: '2025-12-31',
});

// Get payment statistics
const stats = await getPaymentStatistics();

console.log(`Total Revenue: ₱${revenue}`);
console.log(`Successful Payments: ${stats.succeeded}`);
console.log(`Pending Payments: ${stats.pending}`);
```

### Export Reports

```typescript
// Get all payments for a date range
const payments = await getAllPayments({
  startDate: '2025-01-01',
  endDate: '2025-01-31',
});

// Export to CSV
const csv = payments.map(p => ({
  date: p.created_at,
  amount: p.amount,
  method: p.payment_method,
  status: p.status,
}));
```

---

## 🚀 Production Deployment

### 1. Switch to Live Mode

1. Get live API keys from Stripe Dashboard
2. Update environment variables:
   ```env
   VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
   VITE_STRIPE_SECRET_KEY=sk_live_...
   ```

### 2. Update Webhook Endpoint

1. Update webhook URL to production domain
2. Update webhook secret in `.env`

### 3. Enable Production Features

- **3D Secure**: Automatic for applicable cards
- **Dispute Management**: Monitor Stripe Dashboard
- **Fraud Detection**: Enabled by default in Stripe

### 4. Testing Checklist

- [ ] Test successful payments
- [ ] Test declined cards
- [ ] Test refunds
- [ ] Test cash payments
- [ ] Verify email notifications
- [ ] Check payment history
- [ ] Test admin refund process
- [ ] Verify analytics accuracy

---

## 🆘 Support

### Stripe Resources

- **Documentation**: [https://stripe.com/docs](https://stripe.com/docs)
- **Support**: [https://support.stripe.com](https://support.stripe.com)
- **Status**: [https://status.stripe.com](https://status.stripe.com)

### Common Issues

1. **"API key is invalid"**: Check key format and test/live mode
2. **"Amount must be at least"**: Stripe requires minimum amounts (₱20 for PHP)
3. **"Customer authentication required"**: Use 3D Secure test cards

---

## 📝 Next Steps

### Recommended Enhancements

1. **Recurring Payments**: Subscriptions for regular customers
2. **Installment Plans**: Split payments over time
3. **Multiple Currencies**: Support international customers
4. **Payment Links**: Share payment links via SMS/email
5. **Advanced Fraud Detection**: Custom rules and alerts

### Integration with Other Features

- **SMS Notifications**: Send payment receipts via SMS
- **Loyalty Program**: Earn points on payments
- **Analytics Dashboard**: Visualize payment trends
- **Mobile App**: React Native Stripe integration

---

## 🎉 Summary

You now have a complete payment gateway integration with:

✅ Secure Stripe payment processing  
✅ Multiple payment methods (Card, GCash, Cash)  
✅ Refund management  
✅ Payment history and analytics  
✅ Admin payment management  
✅ Comprehensive testing tools  
✅ Production-ready security  

**Need help?** Check the troubleshooting section or consult the Stripe documentation.
