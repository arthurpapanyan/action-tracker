"use strict";

const config = require("./config.js");

const { Kafka, CompressionTypes, CompressionCodecs } = require("kafkajs");
const SnappyCodec = require("kafkajs-snappy");

// Initialize kafka instance and enable snappy compression.
const kafka = new Kafka(config.kafka);
CompressionCodecs[CompressionTypes.Snappy] = SnappyCodec;
const consumer = kafka.consumer(config.consumer);

/**
 * Main function for starting the application.
 */
 async function run() {
    const {
        app: { sourceTopic: topic },
    } = config;

    await consumer.connect();
    await consumer.subscribe({ topic });

    await consumer.run({
        partitionsConsumedConcurrently: 3,
        eachMessage: ({ topic, partition, message, heartbeat }) => {
            console.log(JSON.parse(message.value.toString()));
        },
    });
}

run().catch((e) => {
    console.error(`[action-tracker-app/consumer] ${e.message}`, e);
});

// Enable graceful shutdown.
const errorTypes = ["unhandledRejection", "uncaughtException"];
const signalTraps = ["SIGTERM", "SIGINT", "SIGUSR2"];

errorTypes.forEach((type) => {
    process.on(type, async (e) => {
        try {
            console.log(`process.on ${type}`);
            console.error(e);
            await consumer.disconnect();
            process.exit(0);
        } catch {
            process.exit(1);
        }
    });
});

signalTraps.forEach((type) => {
    process.once(type, async () => {
        try {
            await consumer.disconnect();
        } finally {
            process.kill(process.pid, type);
        }
    });
});