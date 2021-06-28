const { parseMultipartData, sanitizeEntity } = require('strapi-utils');
const stripe = require('stripe')('sk_test_51IVidiGxZZobHUWgUxSkRdtOjjwU5e6x0bl28heWnlWo1o3a8L7y7MMeS7gzC8cOw9NqlDt7O8KMLHs5SxQeiBeH00kwTpVn93');
const unparsed = require("koa-body/unparsed.js");

module.exports = {
    async create(ctx) {
        const body = ctx.request.body
        const cart = await strapi.query("cart").findOne({ id: body.cart })
        const productIds = cart.items.map((item) => item.product)
        const orderedProducts = await strapi.query("product").find({ id_in: productIds })
        const totalPriceforProducts = cart.items.reduce((total, currentItem) => {
            const matchingProduct = orderedProducts.find((product) => product.id === currentItem.product)
            return total + matchingProduct.price * currentItem.count
        }, 0)

        const shippingMethod = await strapi.query("shipping-method").findOne({ id: body.shippingMethod })
        const paymentMethod = await strapi.query("payment-method").findOne({ id: body.paymentMethod })

        const totalPrice = totalPriceforProducts + shippingMethod.price + paymentMethod.price


        const paymentIntent = await stripe.paymentIntents.create({
            amount: totalPrice,
            currency: 'czk',
        });
        if (ctx.is('multipart')) {
            const { data, files } = parseMultipartData(ctx);
            entity = await strapi.services.order.create(data, { files });
        } else {
            entity = await strapi.services.order.create({ ...body, token: paymentIntent.client_secret, total: totalPrice });
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