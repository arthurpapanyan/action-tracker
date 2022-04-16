"use strict";

const config = require("./config.js");

const { Kafka, CompressionTypes, CompressionCodecs } = require("kafkajs");
const SnappyCodec = require("kafkajs-snappy");
const EventEmitter = require("events");
const { Client } = require('@elastic/elasticsearch');
const { validateConsumedRecord } = require("./utils/Validator");

const onConsumed = require("./handlers/onConsumed.js");
const onNotify = require("./handlers/onNotify.js");

// Initialize kafka instance and enable snappy compression.
const kafka = new Kafka(config.kafka);
CompressionCodecs[CompressionTypes.Snappy] = SnappyCodec;
const producer = kafka.producer(config.producer);
const consumer = kafka.consumer(config.consumer);

const emitter = new EventEmitter();
const elastic = new Client(config.elasticsearch);

emitter.on("consumed", onConsumed(emitter, elastic));
emitter.on("error", (err) => {
    console.error(err);
});

/**
 * Main function for starting the application.
 */
async function run() {
    const {
        app: { sourceTopic: topic },
    } = config;

    await producer.connect();
    await consumer.connect();
    await consumer.subscribe({ topic, fromBeginning: true });

    emitter.on("notify", onNotify(producer));

    await consumer.run({
        partitionsConsumedConcurrently: 3,
        eachMessage: ({ topic, partition, message, heartbeat }) => {
            try {
                const { key, value } = message;
                const records = validateConsumedRecord(JSON.parse(value.toString()));

                records.forEach((record) => {
                    emitter.emit("consumed", key.toString(), record);
                });
            } catch (err) {
                emitter.emit("error", err);
            }
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
            await elastic.close();
            await producer.disconnect();
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
            await elastic.close();
            await producer.disconnect();
            await consumer.disconnect();
        } finally {
            process.kill(process.pid, type);
        }
    });
});