"use strict";

const notifiables = [
    "activity"
];

/**
 * Determine whether record should be notified or not.
 *
 * @param {Object} record Consumed record
 *
 * @returns {Boolean} True in case the record should be notified and False otherwise.
 */
function shouldNotify(record) {
    const { index } = record;

    return notifiables.includes(index);
}

module.exports = function (emitter, client) {
    return async (key, record) => {
        if (shouldNotify(record)) {
            emitter.emit("notify", key, record);
        }

        // Store data into Elasticsearch...
        const { index, document } = record;

        await client.index({ index, document });
    };
}