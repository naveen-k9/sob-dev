import { z } from 'zod';
import { publicProcedure } from '@/backend/trpc/create-context';

const env = {
  keyId: process.env.EXPO_PUBLIC_RAZORPAY_ID ?? '',
  secret: process.env.RAZORPAY_SECRET ?? '',
};

export default publicProcedure
  .input(
    z.object({
      amount: z.number().positive(),
      currency: z.string().default('INR'),
      receipt: z.string().optional(),
      notes: z.record(z.string(), z.string()).optional(),
    })
  )
  .mutation(async ({ input }) => {
    const { amount, currency, receipt, notes } = input;

    if (!env.keyId || !env.secret) {
      console.error('[trpc][razorpay] keys not configured', { hasKeyId: !!env.keyId, hasSecret: !!env.secret });
      throw new Error('Razorpay keys not configured');
    }

    const auth = Buffer.from(`${env.keyId}:${env.secret}`).toString('base64');

    const payload = {
      amount: Math.round(amount * 100),
      currency,
      receipt: receipt ?? `rcpt_${Date.now()}`,
      notes: notes ?? {},
    } as const;

    const resp = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error('[trpc][razorpay] create-order failed', errText);
      throw new Error('Failed to create order');
    }

    const data = await resp.json();
    return data as { id: string; amount: number; currency: string };
  });