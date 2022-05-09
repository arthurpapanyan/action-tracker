"use strict";

const crypto = require("crypto");
const fs = require("fs");
const dotenv = require("dotenv");

dotenv.config();

const {
    KAFKA_CLIENT_ID,
    KAFKA_BOOTSTRAP_SERVERS,
    KAFKA_SECURITY_PROTOCOL,
    KAFKA_SASL_MECHANISMS,
    KAFKA_SASL_USERNAME,
    KAFKA_SASL_PASSWORD,
    KAFKA_CONSUMER_GROUP_ID,
    KAFKA_CONSUME_TOPIC,
    KAFKA_PRODUCE_NOTIFICATION_TOPIC,
    KAFKA_PRODUCER_DEBUG,
    KAFKA_CONSUMER_DEBUG,

    ELASTICSEARCH_AUTH_STRATEGY,
    ELASTICSEARCH_NODE,
    ELASTICSEARCH_USERNAME,
    ELASTICSEARCH_PASSWORD,
    ELASTICSEARCH_CA_CERTIFICATE_PATH,
    ELASTICSEARCH_CLOUD_ID,
    ELASTICSEARCH_API_KEY,
} = process.env;

const consumer = {
    "client.id": KAFKA_CLIENT_ID || "action-tracker-app",
    "bootstrap.servers": KAFKA_BOOTSTRAP_SERVERS.split(","),
    "group.id": KAFKA_CONSUMER_GROUP_ID,
    "allow.auto.create.topics": false,
    "socket.keepalive.enable": true,
    "session.timeout.ms": 60000,
    "group.instance.id": crypto.randomBytes(20).toString('hex'),
};

const producer = {
    "client.id": KAFKA_CLIENT_ID || "action-tracker-app",
    "bootstrap.servers": KAFKA_BOOTSTRAP_SERVERS.split(","),
    "enable.idempotence": true,
    "partitioner": "murmur2",
    "compression.codec": "snappy",
    "socket.keepalive.enable": true,
    "retry.backoff.ms": 1000,
    "dr_cb": true,
    "dr_msg_cb": true,
    "event_cb": true,
};

if (KAFKA_SECURITY_PROTOCOL) {
    const security = {
        "sasl.username": KAFKA_SASL_USERNAME,
        "sasl.password": KAFKA_SASL_PASSWORD,
        "security.protocol": KAFKA_SECURITY_PROTOCOL,
        "sasl.mechanisms": KAFKA_SASL_MECHANISMS,
    };

    Object.assign(producer, security);
    Object.assign(consumer, security);
}

if (KAFKA_PRODUCER_DEBUG) {
    Object.assign(producer, { "debug": KAFKA_PRODUCER_DEBUG });
}

if (KAFKA_CONSUMER_DEBUG) {
    Object.assign(consumer, { "debug": KAFKA_CONSUMER_DEBUG });
}

const app = {
    sourceTopic: KAFKA_CONSUME_TOPIC,
    sinkNotificationTopic: KAFKA_PRODUCE_NOTIFICATION_TOPIC,
};

const elasticsearch = {
    suggestCompression: true,
    compression: "gzip",
    name: "action-tracker",
};

if (ELASTICSEARCH_AUTH_STRATEGY === "basic") {
    Object.assign(elasticsearch, {
        node: ELASTICSEARCH_NODE,
        auth: {
            username: ELASTICSEARCH_USERNAME,
            password: ELASTICSEARCH_PASSWORD
        },
        tls: {
            ca: fs.readFileSync(ELASTICSEARCH_CA_CERTIFICATE_PATH),
            rejectUnauthorized: false
        }
    });
} else if (ELASTICSEARCH_AUTH_STRATEGY === "cloud") {
    Object.assign(elasticsearch, {
        cloud: {
            id: ELASTICSEARCH_CLOUD_ID
        },
        auth: {
            apiKey: ELASTICSEARCH_API_KEY
        },
    });
}

module.exports = {
    consumer,
    producer,
    app,
    elasticsearch,
};