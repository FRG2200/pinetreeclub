import type { Express } from 'express';
import { db } from '../db';
import { sql } from 'drizzle-orm';
import { getUncachableStripeClient, getStripePublishableKey } from './stripeClient';
import { isAuthenticated } from '../replit_integrations/auth';
import { storage } from '../storage';

export function registerStripeRoutes(app: Express) {
  app.get('/api/stripe/publishable-key', async (_req, res) => {
    try {
      const key = await getStripePublishableKey();
      res.json({ publishableKey: key });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get publishable key' });
    }
  });

  app.get('/api/stripe/products', async (_req, res) => {
    try {
      const result = await db.execute(
        sql`SELECT 
          p.id as product_id,
          p.name as product_name,
          p.description as product_description,
          p.metadata as product_metadata,
          pr.id as price_id,
          pr.unit_amount,
          pr.currency
        FROM stripe.products p
        LEFT JOIN stripe.prices pr ON pr.product = p.id AND pr.active = true
        WHERE p.active = true
          AND (p.metadata->>'app' = 'pinetreeclub_v2')
        ORDER BY pr.unit_amount ASC`
      );
      res.json(result.rows);
    } catch (error) {
      res.json([]);
    }
  });

  app.post('/api/stripe/checkout', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { priceId } = req.body;

      if (!priceId) {
        return res.status(400).json({ error: 'priceId is required' });
      }

      const stripe = await getUncachableStripeClient();

      const price = await stripe.prices.retrieve(priceId, { expand: ['product'] });
      const product = price.product as any;

      if (!product || product.metadata?.app !== 'pinetreeclub_v2') {
        return res.status(400).json({ error: 'Invalid product' });
      }

      const serverCredits = parseInt(product.metadata?.credits || '0');
      if (serverCredits <= 0) {
        return res.status(400).json({ error: 'Invalid credit package' });
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{ price: priceId, quantity: 1 }],
        mode: 'payment',
        success_url: `${req.protocol}://${req.get('host')}/credits?success=true`,
        cancel_url: `${req.protocol}://${req.get('host')}/pricing?cancelled=true`,
        metadata: {
          userId,
          packageCredits: String(serverCredits),
          productId: product.id,
        },
      });

      res.json({ url: session.url });
    } catch (error: any) {
      console.error('Checkout error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/stripe/webhook/credits', async (req: any, res) => {
    try {
      const event = req.body;

      if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const userId = session.metadata?.userId;
        const credits = parseInt(session.metadata?.packageCredits || '0');

        if (userId && credits > 0) {
          await storage.addCredits(userId, credits);
          console.log(`Added ${credits} credits to user ${userId}`);
        }
      }

      res.json({ received: true });
    } catch (error: any) {
      console.error('Credit webhook error:', error);
      res.status(500).json({ error: error.message });
    }
  });
}
