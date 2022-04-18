"use strict";

const fs = require("fs");
const dotenv = require("dotenv");

dotenv.config();

const {
    KAFKA_CLIENT_ID,
    KAFKA_BOOTSTRAP_SERVERS,
    KAFKA_USERNAME,
    KAFKA_PASSWORD,
    KAFKA_CONSUMER_GROUP_ID,
    KAFKA_CONSUME_TOPIC,
    KAFKA_PRODUCE_NOTIFICATION_TOPIC,

    ELASTICSEARCH_AUTH_STRATEGY,
    ELASTICSEARCH_NODE,
    ELASTICSEARCH_USERNAME,
    ELASTICSEARCH_PASSWORD,
    ELASTICSEARCH_CA_CERTIFICATE_PATH,
    ELASTICSEARCH_CLOUD_ID,
    ELASTICSEARCH_API_KEY,
} = process.env;

const kafka = {
    clientId: KAFKA_CLIENT_ID || "transporter-app",
    brokers: KAFKA_BOOTSTRAP_SERVERS.split(","),
    ssl: true,
    sasl: {
        username: KAFKA_USERNAME,
        password: KAFKA_PASSWORD,
        mechanism: "plain",
    },
};

const consumer = {
    groupId: KAFKA_CONSUMER_GROUP_ID,
    sessionTimeout: 60000,
    allowAutoTopicCreation: false,
};

const producer = {
    allowAutoTopicCreation: false,
};

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
    kafka,
    consumer,
    producer,
    app,
    elasticsearch,
};