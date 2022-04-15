"use strict";

const Joi = require("joi");

// Schema of validation constraints for consumed records.
const consumedRecordSchema = Joi.array().items(
    Joi.object({
        index: Joi.string().valid("activity", "products").required(),

        action: Joi.string().valid("create", "update", "delete").required(),

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
    /**
     * Validate consumed record against general constraints.
     *
     * @param {Object} data Consumed record.
     * @returns {Object} Validated record.
     */
    validateConsumedRecord(record) {
        return validate(consumedRecordSchema, record);
    },
};