'use strict';
const { parseMultipartData, sanitizeEntity } = require('strapi-utils');
/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

module.exports = {

    async findBySlug(slug) {
        let entity = await strapi.services.product.findOne({ slug })
        return sanitizeEntity(entity, { model: strapi.models.product })
    }
};
