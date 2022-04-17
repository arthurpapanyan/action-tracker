"use strict";

const config = require("../config.js");

module.exports = function (producer) {
    return async (key, record) => {
        const {
            app: {
                sinkNotificationTopic: topic,
            },
        } = config;

        const { document } = record;

        await producer.send({
            topic,
            messages: [
                {
                    key,
                    value: JSON.stringify({
                        project: key,
                        room: "activity",
                        notification: {
                            type: "activity-record",
                            document,
                        },
                    }),
                }
            ],
        });
    };
}