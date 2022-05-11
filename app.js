"use strict";

const config = require("./config.js");

const { createProducer, createConsumer } = require("./services/kafka");
const EventEmitter = require("events");
const { Client } = require('@elastic/elasticsearch');
const { logger: log, validator, graceful } = require("./utils");
const { onConsumed, onNotify, onError } = require("./handlers/stack");

const emitter = new EventEmitter();
const elastic = new Client(config.elasticsearch);

emitter.on("error", onError());

const logger = log.createLogger();

/**
 * Main function for starting the application.
 */
async function run() {
    // Initialize kafka producer and consumer instances.
    const producer = await createProducer(config.producer);
    const consumer = await createConsumer(config.consumer);
    const {
        app: { sourceTopic: topic },
    } = config;

    emitter.on("consumed", onConsumed(emitter, elastic, consumer));
    emitter.on("notify", onNotify(producer));

    consumer.subscribe([topic]);
    consumer.consume((err, message) => {
        if (err) {
            emitter.emit("error", err);
            return;
        }

        try {
            const { key, value, topic, offset, partition } = message;
            const records = validator.validateConsumedRecord(JSON.parse(value.toString()));

            emitter.emit("consumed", key.toString(), records, { topic, offset, partition });
        } catch (err) {
            emitter.emit("error", err);
        }
    });

    /**
     * Graceful shutdown handler for producer and consumer.
     */
    function shutdown() {
        consumer.disconnect(() => {
            logger.info("Consumer disconnected.");
            producer.disconnect(10000, () => {
                logger.info("Producer disconnected.");
                process.exit(0);
            });
        });
    }

    graceful.errorShutdown(shutdown);
    graceful.signalShutdown(shutdown);
}

run().catch((e) => {
    console.error(`[action-tracker-app/consumer] ${e.message}`, e);
});

// Enable graceful shutdown on errors.
graceful.errorShutdown(async (e) => {
    try {
        logger.info("Closing enasticsearch connection.");
        logger.error(e);
        await elastic.close();
    } catch {
        process.exit(1);
    }
});

// Enable graceful shutdown on signals.
graceful.signalShutdown(async (signal) => {
    try {
        logger.info("Closing enasticsearch connection.");
        await elastic.close();
    } catch {
        process.kill(process.pid, signal);
    }
});