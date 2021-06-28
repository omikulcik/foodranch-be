const { parseMultipartData, sanitizeEntity } = require('strapi-utils');
const stripe = require('stripe')('sk_test_51IVidiGxZZobHUWgUxSkRdtOjjwU5e6x0bl28heWnlWo1o3a8L7y7MMeS7gzC8cOw9NqlDt7O8KMLHs5SxQeiBeH00kwTpVn93');
const unparsed = require("koa-body/unparsed.js");

module.exports = {
    async create(ctx) {
        const paymentIntent = await stripe.paymentIntents.create({
            amount: 150000,
            currency: 'czk',
            // Verify your integration in this guide by including this parameter
            metadata: { integration_check: 'accept_a_payment' },
        });
        console.log(paymentIntent)
        if (ctx.is('multipart')) {
            const { data, files } = parseMultipartData(ctx);
            entity = await strapi.services.order.create(data, { files });
        } else {
            entity = await strapi.services.order.create({ ...ctx.request.body, token: paymentIntent.client_secret });
        }

        entity = sanitizeEntity(entity, { model: strapi.models.order });
        return entity;
    },
    async confirmPayment(ctx) {
        const eps = "whsec_sjbfrT1oTqXjqmqKfa0lXDioyB2Jde2M"
        const sig = ctx.request.headers['stripe-signature']
        let event;

        try {
            event = stripe.webhooks.constructEvent(ctx.request.body[unparsed], sig, eps);
        }
        catch (err) {
            ctx.response.status = 401
            ctx.response.body = {
                message: "Wrong Stripe signature - authorization failed"
            }
            return ctx.response
        }
        // Handle the event
        strapi.log.debug(event.data.object, "eventik")
        console.log(event.data.object)
        switch (event.type) {
            case 'payment_intent.succeeded':
                const paymentIntent = event.data.object;
                strapi.log.debug(paymentIntent)
                await strapi.services.order.update({ token: paymentIntent.client_secret }, { isPayed: true })
                break;
            default:
                console.log(`Unhandled event type ${event.type}`);
        }

        // Return a response to acknowledge receipt of the event
        return ctx.response.body = { recieved: true }
    }
};