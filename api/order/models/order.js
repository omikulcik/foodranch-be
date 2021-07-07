'use strict';
const PdfPrinter = require('pdfmake');
const fs = require('fs');
/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/concepts/models.html#lifecycle-hooks)
 * to customize this model
 */

module.exports = {
    lifecycles: {
        async afterCreate(data) {
            const printer = new PdfPrinter();
            const docDefinition = {
                content: [
                    "Moje lidi nech bejt",
                    "Šprchuju nasta face"
                ]
            }
            const pdfDoc = printer.createPdfKitDocument(docDefinition)
            pdfDoc.pipe(fs.createWriteStream('document.pdf'))
            pdfDoc.end()
            console.log(pdfDoc)
        }
    }
};
