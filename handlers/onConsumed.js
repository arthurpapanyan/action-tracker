"use strict";

const notifiables = [
    "activity"
];

function shouldNotify(record) {
    const { index } = record;

    return notifiables.includes(index);
}

module.exports = function (emitter) {
    return (key, record) => {
        if (shouldNotify(record)) {
            emitter.emit("notify", key, record);
        }

        // Store data into Elasticsearch...
    };
}