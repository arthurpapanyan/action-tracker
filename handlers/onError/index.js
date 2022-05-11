"use strict";

const { logger: log } = require("../../utils");
const { ElasticsearchClientError } = require("@elastic/transport/lib/errors");

/**
 * Return event handler for emitted "error" events.
 *
 * The handler logs errors to the standard error output.
 *
 * @returns {function} Event handler.
 */
module.exports = function () {
    const logger = log.createLogger();

    return (err) => {
        logger.error("There was an error:", err);

        // If the error is instance of the ElasticsearchClientError we propogate the error to kill the running node process.
        if (err instanceof ElasticsearchClientError) {
            throw err;
        }
    };
};
