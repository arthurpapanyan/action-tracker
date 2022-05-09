"use strict";

const config = require("../../config.js");

module.exports = function (producer) {
    return async (key, record) => {
        const {
            app: {
                sinkNotificationTopic: topic,
            },
        } = config;

        const { document } = record;
        const value = JSON.stringify({
            project: key,
            room: "activity",
            notification: {
                type: "activity-record",
                document,
            },
        })

        producer.produce(topic, -1, Buffer.from(value), key);
    };
}