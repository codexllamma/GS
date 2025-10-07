// pages/api/razorpay/create-razorpay.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import Razorpay from 'razorpay'

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  const { amount, currency, orderId } = req.body; 
  if (!amount || !currency || !orderId) return res.status(400).json({ error: 'Missing parameters' });

  try {
    const options = {
      amount, 
      currency,
      receipt: `order_${orderId.slice(0, 20)}`,
    };
    const order = await razorpay.orders.create(options);
    res.status(200).json(order);
  } catch (err) {
    console.error('Razorpay order creation failed:', err);
    res.status(500).json({ error: 'Failed to create Razorpay order' });
  }
}
