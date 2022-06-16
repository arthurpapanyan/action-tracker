"use strict";

const winston = require('winston');
const Joi = require("joi");
const assert = require("assert").strict;

const errorTypes = ["unhandledRejection", "uncaughtException"];
const signalTraps = ["SIGTERM", "SIGINT", "SIGUSR2"];

/**
 * Register error handler.
 *
 * @param {Function} callback Error handler.
 */
function errorShutdown(callback) {
    assert.ok(
        typeof callback === "function",
        "Argument 'callback' must be a function."
    );

    errorTypes.forEach((type) => {
        process.on(type, callback);
    });
}

/**
 * Register signal handler.
 *
 * @param {Function} callback Signal handler.
 */
function signalShutdown(callback) {
    assert.ok(
        typeof callback === "function",
        "Argument 'callback' must be a function."
    );

    signalTraps.forEach((type) => {

        process.once(
            type,
            ((type) => callback)(type)
        );
});
}

// Schema of validation constraints for consumed records.
const consumedRecordSchema = Joi.array().items(
    Joi.object({
        index: Joi.string().valid("activity", "products").required(),

        params: Joi.alternatives().try(Joi.object(), Joi.array()).allow(null).required(),

        document: Joi.object().allow(null).required(),
    })
);

/**
* Validate given data with the given schema.
*
* @param {Object} schema Schema of the constraints.
* @param {Object} data Data to be validated.
*
* @returns {Object} Validated data.
* @throws {Error} In case of validation error.
*/
function validate(schema, data) {
    const { value, error } = schema.validate(data);

    if (error) {
        throw error;
    }

    return value;
}

module.exports = {
    logger: {
        /**
        * Create instance of Logger object.
        *
        * @returns {Logger}
        */
        createLogger() {
            return winston.createLogger({
                level: 'info',
                format: winston.format.combine(
                    winston.format.colorize({ message: false }),
                    winston.format.simple()
                ),
                transports: [
                    new winston.transports.Console(),
                    new winston.transports.File({ filename: 'info.log', level: 'info', format: winston.format.simple() }),
                ],
            });
        },
    },
    validator: {
        /**
        * Validate consumed record against general constraints.
        *
        * @param {Object} data Consumed record.
        * @returns {Object} Validated record.
        */
        validateConsumedRecord(record) {
            return validate(consumedRecordSchema, record);
        },
    },
    graceful: {
        errorShutdown,
        signalShutdown,
    }
};