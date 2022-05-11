"use strict";

const { consumer } = require("../../config");

// List of notifiable rooms.
const notifiables = [
    "activity",
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

module.exports = function (emitter, client, consumer) {
    return async (key, records, { topic, offset, partition }) => {
        try {
            for await (const record of records) {
                // Store data into Elasticsearch...
                const { index, document } = record;
                await client.index({ index, document });

                if (shouldNotify(record)) {
                    emitter.emit("notify", key, record);
                }
            }

            offset++;
            consumer.commit({ topic, offset, partition });
        } catch (e) {
            emitter.emit("error", e);
        }
    };
}