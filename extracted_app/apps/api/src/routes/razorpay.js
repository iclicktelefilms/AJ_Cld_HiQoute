import { Router } from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import pb from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';

const router = Router();

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * POST /razorpay/create-order
 * Creates a Razorpay order for a given plan
 * Body: { planId: string, userId: string }
 * Returns: { orderId, amount, currency, key }
 */
router.post('/create-order', async (req, res) => {
    const { planId, userId } = req.body;

    logger.info(`[Razorpay] Creating order for user: ${userId}, plan: ${planId}`);

    // Validate required fields
    if (!planId || !userId) {
        logger.warn('[Razorpay] Missing required fields: planId or userId');
        return res.status(400).json({ error: 'planId and userId are required' });
    }

    // Fetch plan from PocketBase
    let plan;
    try {
        plan = await pb.collection('plans').getOne(planId, { $autoCancel: false });
        logger.info(`[Razorpay] Plan fetched: ${planId}, price: ${plan.price}`);
    } catch (error) {
        logger.error(`[Razorpay] Plan not found: ${planId}`, error);
        throw new Error(`Plan not found: ${planId}`);
    }

    if (!plan || !plan.price) {
        logger.error(`[Razorpay] Invalid plan data for planId: ${planId}`);
        throw new Error('Invalid plan data');
    }

    // Convert amount to paise (1 INR = 100 paise)
    const amountInPaise = Math.round(plan.price * 100);

    const options = {
        amount: amountInPaise,
        currency: 'INR',
        receipt: `receipt_${userId}_${planId}_${Date.now()}`.substring(0, 40),
        notes: {
            userId: userId,
            planId: planId,
            planName: plan.name || 'Unknown',
            amount: plan.price
        }
    };

    logger.info(`[Razorpay] Order options:`, options);

    // Create order with Razorpay
    let order;
    try {
        order = await razorpay.orders.create(options);
        logger.info(`[Razorpay] Order created successfully: ${order.id}, amount: ${order.amount} paise`);
    } catch (error) {
        logger.error('[Razorpay] Failed to create order', error);
        throw new Error(`Failed to create Razorpay order: ${error.message}`);
    }

    res.json({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        key: process.env.RAZORPAY_KEY_ID
    });
});

/**
 * POST /razorpay/verify-payment
 * Verifies payment signature and updates user's plan
 * Body: { orderId: string, paymentId: string, signature: string }
 * Returns: { success: true, message: string }
 */
router.post('/verify-payment', async (req, res) => {
    const { orderId, paymentId, signature } = req.body;

    logger.info(`[Razorpay] Verifying payment - orderId: ${orderId}, paymentId: ${paymentId}`);

    // Validate required fields
    if (!orderId || !paymentId || !signature) {
        logger.warn('[Razorpay] Missing required fields for verification');
        return res.status(400).json({ error: 'orderId, paymentId, and signature are required' });
    }

    // Verify signature
    const body = orderId + '|' + paymentId;
    const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex');

    if (expectedSignature !== signature) {
        logger.error(`[Razorpay] Signature mismatch - expected: ${expectedSignature}, received: ${signature}`);
        throw new Error('Payment verification failed: Invalid signature');
    }

    logger.info('[Razorpay] Signature verified successfully');

    // Fetch order details from Razorpay
    let order;
    try {
        order = await razorpay.orders.fetch(orderId);
        logger.info(`[Razorpay] Order fetched: ${orderId}, status: ${order.status}`);
    } catch (error) {
        logger.error(`[Razorpay] Failed to fetch order: ${orderId}`, error);
        throw new Error(`Failed to fetch order details: ${error.message}`);
    }

    const { userId, planId, amount } = order.notes;

    if (!userId || !planId) {
        logger.error(`[Razorpay] Order notes missing user or plan context - orderId: ${orderId}`);
        throw new Error('Order notes missing user or plan context');
    }

    logger.info(`[Razorpay] Processing payment for user: ${userId}, plan: ${planId}, amount: ${amount}`);

    try {
        // 1. Update or create user_plans record
        logger.info(`[Razorpay] Fetching existing user plans for user: ${userId}`);
        const userPlans = await pb.collection('user_plans').getList(1, 1, {
            filter: `user_id="${userId}"`,
            sort: '-created',
            $autoCancel: false
        });

        let currentExpiry = new Date();
        if (userPlans.items.length > 0) {
            const existingPlan = userPlans.items[0];
            logger.info(`[Razorpay] Existing plan found: ${existingPlan.id}, expiry: ${existingPlan.expiry_date}`);
            
            if (existingPlan.expiry_date && new Date(existingPlan.expiry_date) > new Date()) {
                currentExpiry = new Date(existingPlan.expiry_date);
                logger.info(`[Razorpay] Using existing expiry date: ${currentExpiry}`);
            }
            currentExpiry.setDate(currentExpiry.getDate() + 30);
            
            await pb.collection('user_plans').update(existingPlan.id, {
                expiry_date: currentExpiry.toISOString(),
                plan_id: planId
            }, { $autoCancel: false });
            logger.info(`[Razorpay] Updated user plan: ${existingPlan.id}, new expiry: ${currentExpiry}`);
        } else {
            logger.info(`[Razorpay] No existing plan found, creating new user plan`);
            currentExpiry.setDate(currentExpiry.getDate() + 30);
            const newPlan = await pb.collection('user_plans').create({
                user_id: userId,
                plan_id: planId,
                assigned_date: new Date().toISOString(),
                expiry_date: currentExpiry.toISOString()
            }, { $autoCancel: false });
            logger.info(`[Razorpay] Created new user plan: ${newPlan.id}, expiry: ${currentExpiry}`);
        }

        // 2. Update user's plan_id
        await pb.collection('users').update(userId, { plan_id: planId }, { $autoCancel: false });
        logger.info(`[Razorpay] Updated user plan_id: ${userId} -> ${planId}`);

        // 3. Process referral rewards
        logger.info(`[Razorpay] Checking for pending referrals for user: ${userId}`);
        const referrals = await pb.collection('referrals').getList(1, 1, {
            filter: `referred_user_id="${userId}" && status="pending"`,
            $autoCancel: false
        });

        if (referrals.items.length > 0) {
            const referral = referrals.items[0];
            const referrerId = referral.referrer_id;
            logger.info(`[Razorpay] Processing referral reward for referrer: ${referrerId}`);

            const referrerPlans = await pb.collection('user_plans').getList(1, 1, {
                filter: `user_id="${referrerId}"`,
                sort: '-created',
                $autoCancel: false
            });

            if (referrerPlans.items.length > 0) {
                const rPlan = referrerPlans.items[0];
                let rExpiry = new Date();
                if (rPlan.expiry_date && new Date(rPlan.expiry_date) > new Date()) {
                    rExpiry = new Date(rPlan.expiry_date);
                }
                rExpiry.setDate(rExpiry.getDate() + 30);
                
                await pb.collection('user_plans').update(rPlan.id, {
                    expiry_date: rExpiry.toISOString()
                }, { $autoCancel: false });
                logger.info(`[Razorpay] Updated referrer plan expiry: ${rPlan.id}, new expiry: ${rExpiry}`);
            }

            await pb.collection('referrals').update(referral.id, {
                status: 'completed',
                reward_given: true,
                completed_at: new Date().toISOString()
            }, { $autoCancel: false });
            logger.info(`[Razorpay] Marked referral as completed: ${referral.id}`);
        } else {
            logger.info(`[Razorpay] No pending referrals found for user: ${userId}`);
        }

        // 4. Create payment record
        const paymentRecord = await pb.collection('payments').create({
            orderId: orderId,
            paymentId: paymentId,
            userId: userId,
            planId: planId,
            amount: Number(amount),
            status: 'success'
        }, { $autoCancel: false });
        logger.info(`[Razorpay] Payment record created: ${paymentRecord.id}`);

        logger.info(`[Razorpay] Payment verification completed successfully for user: ${userId}`);
        res.json({
            success: true,
            message: 'Payment verified and plan updated',
            paymentId: paymentId,
            orderId: orderId
        });
    } catch (error) {
        logger.error('[Razorpay] Error during payment verification process', error);
        throw new Error(`Payment verification process failed: ${error.message}`);
    }
});

/**
 * POST /razorpay/webhook
 * Handles Razorpay webhook events (payment.authorized, payment.captured, etc.)
 * Validates webhook signature and updates user's plan when payment is captured
 * Returns: { success: true }
 */
router.post('/webhook', async (req, res) => {
    const webhookSignature = req.headers['x-razorpay-signature'];
    const webhookBody = JSON.stringify(req.body);

    logger.info('[Razorpay Webhook] Received webhook event');
    logger.debug('[Razorpay Webhook] Signature:', webhookSignature);
    logger.debug('[Razorpay Webhook] Body:', webhookBody);

    // Validate webhook signature
    const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
        .update(webhookBody)
        .digest('hex');

    if (expectedSignature !== webhookSignature) {
        logger.error('[Razorpay Webhook] Signature mismatch - webhook rejected');
        logger.error(`[Razorpay Webhook] Expected: ${expectedSignature}, Received: ${webhookSignature}`);
        return res.status(401).json({ error: 'Invalid webhook signature' });
    }

    logger.info('[Razorpay Webhook] Signature verified successfully');

    const event = req.body.event;
    const payload = req.body.payload;

    logger.info(`[Razorpay Webhook] Processing event: ${event}`);

    try {
        // Handle payment.authorized event
        if (event === 'payment.authorized') {
            const payment = payload.payment.entity;
            const orderId = payment.order_id;
            const paymentId = payment.id;
            const status = payment.status;

            logger.info(`[Razorpay Webhook] Payment authorized - paymentId: ${paymentId}, orderId: ${orderId}, status: ${status}`);

            // Fetch order to get user and plan info
            let order;
            try {
                order = await razorpay.orders.fetch(orderId);
                logger.info(`[Razorpay Webhook] Order fetched: ${orderId}`);
            } catch (error) {
                logger.error(`[Razorpay Webhook] Failed to fetch order: ${orderId}`, error);
                // Still return 200 to acknowledge webhook
                return res.json({ success: true, message: 'Webhook acknowledged' });
            }

            const { userId, planId, amount } = order.notes;

            if (!userId || !planId) {
                logger.warn(`[Razorpay Webhook] Order notes missing user or plan context - orderId: ${orderId}`);
                return res.json({ success: true, message: 'Webhook acknowledged' });
            }

            logger.info(`[Razorpay Webhook] Processing payment for user: ${userId}, plan: ${planId}`);

            // Update or create user_plans record
            const userPlans = await pb.collection('user_plans').getList(1, 1, {
                filter: `user_id="${userId}"`,
                sort: '-created',
                $autoCancel: false
            });

            let currentExpiry = new Date();
            if (userPlans.items.length > 0) {
                const existingPlan = userPlans.items[0];
                if (existingPlan.expiry_date && new Date(existingPlan.expiry_date) > new Date()) {
                    currentExpiry = new Date(existingPlan.expiry_date);
                }
                currentExpiry.setDate(currentExpiry.getDate() + 30);
                
                await pb.collection('user_plans').update(existingPlan.id, {
                    expiry_date: currentExpiry.toISOString(),
                    plan_id: planId
                }, { $autoCancel: false });
                logger.info(`[Razorpay Webhook] Updated user plan: ${existingPlan.id}`);
            } else {
                currentExpiry.setDate(currentExpiry.getDate() + 30);
                const newPlan = await pb.collection('user_plans').create({
                    user_id: userId,
                    plan_id: planId,
                    assigned_date: new Date().toISOString(),
                    expiry_date: currentExpiry.toISOString()
                }, { $autoCancel: false });
                logger.info(`[Razorpay Webhook] Created new user plan: ${newPlan.id}`);
            }

            // Update user's plan_id
            await pb.collection('users').update(userId, { plan_id: planId }, { $autoCancel: false });
            logger.info(`[Razorpay Webhook] Updated user plan_id: ${userId} -> ${planId}`);

            // Create payment record
            const paymentRecord = await pb.collection('payments').create({
                orderId: orderId,
                paymentId: paymentId,
                userId: userId,
                planId: planId,
                amount: Number(amount),
                status: 'authorized'
            }, { $autoCancel: false });
            logger.info(`[Razorpay Webhook] Payment record created: ${paymentRecord.id}`);

            logger.info(`[Razorpay Webhook] Payment authorized event processed successfully`);
        }
        // Handle payment.captured event
        else if (event === 'payment.captured') {
            const payment = payload.payment.entity;
            const paymentId = payment.id;
            const orderId = payment.order_id;

            logger.info(`[Razorpay Webhook] Payment captured - paymentId: ${paymentId}, orderId: ${orderId}`);

            // Update payment record status to captured
            try {
                const payments = await pb.collection('payments').getList(1, 1, {
                    filter: `paymentId="${paymentId}"`,
                    $autoCancel: false
                });

                if (payments.items.length > 0) {
                    await pb.collection('payments').update(payments.items[0].id, {
                        status: 'captured'
                    }, { $autoCancel: false });
                    logger.info(`[Razorpay Webhook] Updated payment status to captured: ${paymentId}`);
                }
            } catch (error) {
                logger.error(`[Razorpay Webhook] Failed to update payment status: ${paymentId}`, error);
            }
        }
        // Handle payment.failed event
        else if (event === 'payment.failed') {
            const payment = payload.payment.entity;
            const paymentId = payment.id;
            const orderId = payment.order_id;
            const reason = payment.error_reason || 'Unknown';

            logger.warn(`[Razorpay Webhook] Payment failed - paymentId: ${paymentId}, orderId: ${orderId}, reason: ${reason}`);

            // Update payment record status to failed
            try {
                const payments = await pb.collection('payments').getList(1, 1, {
                    filter: `paymentId="${paymentId}"`,
                    $autoCancel: false
                });

                if (payments.items.length > 0) {
                    await pb.collection('payments').update(payments.items[0].id, {
                        status: 'failed'
                    }, { $autoCancel: false });
                    logger.info(`[Razorpay Webhook] Updated payment status to failed: ${paymentId}`);
                }
            } catch (error) {
                logger.error(`[Razorpay Webhook] Failed to update payment status: ${paymentId}`, error);
            }
        }
        // Handle other events
        else {
            logger.info(`[Razorpay Webhook] Unhandled event type: ${event}`);
        }

        // Always return 200 OK to acknowledge webhook receipt
        res.json({ success: true, message: 'Webhook acknowledged' });
    } catch (error) {
        logger.error('[Razorpay Webhook] Error processing webhook', error);
        // Still return 200 to prevent Razorpay from retrying
        res.json({ success: true, message: 'Webhook acknowledged' });
    }
});

export default router;