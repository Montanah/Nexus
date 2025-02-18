const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Nexus API",
            version: "1.0.0",
            description: "API documentation for managing products, users, travelers, and payments.",
        },
        servers: [
            {
                url: "http://localhost:3001",
                description: "Local server",
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                },
            },
        },
        tags: [
            { name: "Users", description: "Users Rrgistration. Login"},
            { name: "Products", description: "Operations related to products" },
            { name: "Admin", description: "Admin functionalities" },
            { name: "Traveler", description: "Traveler-related operations" },
            { name: "Payment", description: "Payment transactions and processing" },
        ],
    },
    apis: ["./routes/*.js"],
};

const swaggerSpec = swaggerJsDoc(options);

const setupSwagger = (app) => {
    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};

module.exports = setupSwagger;
