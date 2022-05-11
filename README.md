# action-tracker
Service for tracking different actions happening on behalf of the user behavior. It stores information in Elasticsearch for later use.

> **_NOTE:_**  When you include `node-rdkafka` into your project, the default behavior will cause NPM to build `librdkafka` from source when generating the `node-gyp` bindings. This can be a real pain in the ass if you have a bunch of services on the same machine using the same library.
> There's a little known trick to avoid this. You can force `node-rdkafka` to use the system's version of librdkafka by specifying the `BUILD_LIBRDKAFKA=0` environment variable.