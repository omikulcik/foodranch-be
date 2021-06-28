

module.exports = {
    definition: ``,
    query: `
    productBySlug(slug: String!): Product
    `,
    type: {},
    resolver: {
        Query: {
            productBySlug: {
                description: "Find product by slug",
                resolverOf: "application::product.product.findBySlug",
                resolver: async (obj, options, { context }) => {
                    return await strapi.controllers.product.findBySlug(context.params._slug)
                }
            }
        }
    },
};