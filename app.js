"use strict";

const config = require("./config.js");

const { createProducer, createConsumer, disconnectConsumer, disconnectProducer } = require("./services/kafka");
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
     * Graceful shutdown handler for producer, consumer and elastic client.
     */
    function shutdown(catcherCallback) {
        return async (sigerr) => {
            try {
                await disconnectConsumer(consumer);
                logger.info("Consumer disconnected.");

                await disconnectProducer(producer);
                logger.info("Producer disconnected.");

                await elastic.close();
                logger.info("Elasticsearch connection closed.");
            } catch {
                catcherCallback(sigerr);
            }
        }
    }

    graceful.errorShutdown(
        shutdown(() => {
            process.exit(1)
        })
    );

    graceful.signalShutdown(
        shutdown((signal) => {
            process.kill(process.pid, signal)
        })
    );
}

run().catch((e) => {
    logger.error(`[action-tracker-app/consumer] ${e.message}`, e);
});