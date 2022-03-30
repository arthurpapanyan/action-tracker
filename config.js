"use strict";

const dotenv = require("dotenv");

dotenv.config();

const {
    KAFKA_CLIENT_ID,
    KAFKA_BOOTSTRAP_SERVERS,
    KAFKA_USERNAME,
    KAFKA_PASSWORD,
    KAFKA_CONSUMER_GROUP_ID,
    KAFKA_CONSUME_TOPIC,
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

const app = {
    sourceTopic: KAFKA_CONSUME_TOPIC,
};

module.exports = {
    kafka,
    consumer,
    app,
};