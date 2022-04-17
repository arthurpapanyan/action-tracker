"use strict";

/**
 * Return event handler for emitted "error" events.
 *
 * The handler logs errors to the standard error output.
 *
 * @returns {function} Event handler.
 */
module.exports = function () {
    return (err) => {
        console.error("There was an error:", err);
    };
};
