const { EventHubProducerClient } = require("@azure/event-hubs");

module.exports = class AzureEventHubConnector {

     // check if the required environment variables are set, if are not, log an info message once and disable the connector.
    // do it else if, so that the first missing variable is logged only. check for null or empty
    constructor() {
        if (process.env.AZURE_EVENT_HUB_CONNECTION_STRING == null || process.env.AZURE_EVENT_HUB_CONNECTION_STRING == "") {
            console.log("AZURE_EVENT_HUB_CONNECTION_STRING environment variable is not set. Disabling Azure Event Hub connector.");
            this.isEnabled = false;
        } else if (process.env.AZURE_EVENT_HUB_NAME == null || process.env.AZURE_EVENT_HUB_NAME == "") {
            console.log("AZURE_EVENT_HUB_NAME environment variable is not set. Disabling Azure Event Hub connector.");
            this.isEnabled = false;
        } else {
            // create the client
            this.connectionString = process.env.AZURE_EVENT_HUB_CONNECTION_STRING;
            this.eventHubName = process.env.AZURE_EVENT_HUB_NAME;
            // check if the connection is valid
            this.isEnabled = this.validateConnection();
            if (!this.isEnabled) {
                console.log("Azure EventHub connection could not be established. Disabling Azure EventHub connector.");
            }
        }
    }

    async validateConnection() {
        if (this.connectionString == null || this.connectionString == "") {
            return false;
        }
        if (this.eventHubName == null || this.eventHubName == "") {
            return false;
        }
        try {
            const serviceBusClient = createServiceBusClient();
            await serviceBusClient.close();
            return true;
        } catch (err) {
            return false;
        }
    }

    async sendLogsToAzureEventHubs(workflowRunData, log) {
        if (!this.isEnabled) {
            log.debug(`Azure Event Hub connector is disabled. Logs will not be forwarded.`);
            return;
        }
        try {
          const serviceBusClient = createServiceBusClient();
          await sendLogsToBus(serviceBusClient, workflowRunData);
          await serviceBusClient.close();
          log.debug(`Logs forwarded to Azure Event Hub with status`);
        } catch (err) {
          log.error(`Logs could not be sent. Error: ${err}`);
      
          if (serviceBusClient)
            await serviceBusClient.close();
        }
      }
      
      /**
       * Create a client to send workflow logs to the event hub.
       * @returns {EventHubProducerClient}
       */
      createServiceBusClient() {
        if (!this.isEnabled) {
            log.debug(`Azure Event Hub connector is disabled. Logs will not be forwarded.`);
            return;
        }
        const serviceBusClient = new EventHubProducerClient(this.connectionString, this.eventHubName);
        return serviceBusClient;
      }
      
      /**
       * Send workflow logs to the event hub.
       * @param {*} serviceBusClient 
       * @param {*} logData 
       * @returns 
       */
      async sendLogsToBus(serviceBusClient, logData) {
        if (!this.isEnabled) {
            log.debug(`Azure Event Hub connector is disabled. Logs will not be forwarded.`);
            return;
        }
        // Prepare a batch of three events.
        const batch = await serviceBusClient.createBatch();
        batch.tryAdd({ body: logData });
      
        // Send the batch to the event hub.
        const result = await serviceBusClient.sendBatch(batch);
      
        return result;
      
      }

}

