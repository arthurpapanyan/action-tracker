"use strict";

const Kafka = require('node-rdkafka');
const { logger: log } = require("../../utils");

const logger = log.createLogger();

/**
 * Default delivery report handler.
 *
 * @param {Error} err Error instance.
 * @param {Obhect} report Delivery report object.
 */
function defaultDelivieryReporter(err, report) {
    if (err) {
        logger.error('Error producing', err);
    } else {
        const { topic, key, value } = report;
        let k = key.toString().padEnd(10, ' ');

        logger.info(`Produced event to topic ${topic}: key = ${k} value = ${value}`);
    }
}

/**
 * Create producer instance with given configurations.
 *
 * @param {Object} config Producer configurations object.
 * @param {Function} onDeliveryReport Callback for delivery report.
 *
 * @returns {Promise<Producer>} Producer instance.
 */
function createProducer(config, onDeliveryReport = null) {
    const producer = new Kafka.Producer(config);

    // Poll for events every 1000 ms.
    producer.setPollInterval(1000);

    return new Promise((resolve, reject) => {
        producer
            .on("ready", () => resolve(producer))
            .on("delivery-report", onDeliveryReport || defaultDelivieryReporter)
            .on("event.error", (err) => {
                logger.error(err);
                reject(err);
            })
            .on("event.log", (log) => {
                logger.info(log);
            });

        producer.connect({}, (err) => {
            if (err) {
                logger.error(err);
                return;
            }

            logger.info("Producer connected.");
        });
    });
}

/**
 * Disconnect producer.
 *
 * @param {Producer} producer Producer instance.
 *
 * @returns {Promise<Boolean>} True in case of success.
 */
function disconnectProducer(producer) {
    return new Promise((resolve, reject) => {
        producer.disconnect(10000, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve(true);
            }
        });
    });
}

/**
 * Create consumer instance with given configurations.
 *
 * @param {Object} config Consumer configurations object.
 *
 * @returns {Promise<KafkaConsumer>} Consumer instance.
 */
function createConsumer(config) {
    const consumer = new Kafka.KafkaConsumer(config, { "auto.offset.reset": "earliest" });

    return new Promise((resolve, reject) => {
        consumer
            .on("ready", () => resolve(consumer))
            .on("event.log", (log) => {
                logger.info(log);
            })
            .on("event.error", (err) => {
                reject(err);
            });

        consumer.connect({}, (err) => {
            if (err) {
                logger.error(err);
                return;
            }

            logger.info("Consumer connected.");
        });
    });
};

/**
 * Disconnect consumer.
 *
 * @param {KafkaConsumer} consumer Consumer instance.
 *
 * @returns {Promise<Boolean>} True in case of success.
 */
 function disconnectConsumer(consumer) {
    return new Promise((resolve, reject) => {
        consumer.disconnect((err) => {
            if (err) {
                reject(err);
            } else {
                resolve(true);
            }
        });
    });
}

module.exports = {
    createProducer,
    disconnectProducer,
    createConsumer,
    disconnectConsumer,
};