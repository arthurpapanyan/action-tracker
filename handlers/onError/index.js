"use strict";

const { logger: log } = require("../../utils");

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
    };
};
