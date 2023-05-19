const { Blob } = require('buffer');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const JSZip = require("jszip");
const WorkflowLogsEventStream = require('./workflowLogsEventStream');
const PostgreSQLConnector = require("./postgresql-connector");
const AzureEventHubConnector = require("./azure-event-hub-connector");
const { send } = require('process');


/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Probot} app
 */

// Read from .env file
// const connectionString = process.env.AZURE_EVENT_HUB_CONNECTION_STRING
// const eventHubName = process.env.AZURE_EVENT_HUB_NAME
// const postgresqlUser = process.env.POSTGRESQL_USER
// const postgresqlPassword = process.env.POSTGRESQL_PASSWORD
// const postgresqlHost = process.env.POSTGRESQL_HOST
// const postgresqlPort = process.env.POSTGRESQL_PORT
// const postgresqlDatabase = process.env.POSTGRESQL_DATABASE

// Create a new instance of the Azure Event Hub Connector
const azureEventHubConnector = new AzureEventHubConnector();

// Create a new instance of the PostgreSQL Connector
const postgresqlConnector = new PostgreSQLConnector();

module.exports = (app) => {

  app.on('workflow_run.completed', async (context) => {

    const run_id = context.payload.workflow_run.id;
    const owner = context.payload.repository.owner.login;
    const repo = context.payload.repository.name;

    // Use the GitHub REST API to retrieve the logs for the workflow run
    const response = await context.octokit.request(
      `GET /repos/${owner}/${repo}/actions/runs/${run_id}/logs`,
      { headers: { 'X-GitHub-Api-Version': '2022-11-28', 'accept': 'application/vnd.github+json' } }
    );

    // --------------------------------------------------------------------------------------
    // The logs come in as ArrayBuffer
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer
    // ArrayBuffer caanot be manipulated directly, but we can convert it to a Blog, or Buffer, or Stream 
    // https://developer.mozilla.org/en-US/docs/Web/API/Blob
    // https://nodejs.org/api/buffer.html
    // https://nodejs.org/api/stream.html
    // --------------------------------------------------------------------------------------
    // Store the ArrayBuffer as a Blob
    // Comment these lines after testing
    const logs = response.data;
    const blob = new Blob([logs], {
      type: "application/zip",
    });

    // Convert it to a Buffer and write to a zip file
    // Comment these lines below after testing
    const filePath = path.join(__dirname, 'logs.zip');
    fs.writeFile(filePath, Buffer.from(logs), (err) => {
      if (err) throw err;
      console.log(`The ${filePath} has been saved!`);
    });

    // Start a stream to unzip the logs
    // parse them to enrich the events
    // and send the events to Azure Event Hubs
    processZipFiles(logs, app.log).then(async ({ jobs }) => {
      // Enrich the workflow_run event
      const workflow_run = context.payload.workflow_run;
      // Create a new property called jobs
      workflow_run.jobs = jobs;
      // Flatten the properties
      workflow_run.actor = workflow_run.actor.login;
      workflow_run.repository = workflow_run.repository.full_name;
      workflow_run.triggering_actor = workflow_run.triggering_actor.login;
      workflow_run.head_repository = workflow_run.head_repository.full_name;
      // Send the events to Azure Event Hubs
      app.log.info(`Sending event ${JSON.stringify(workflow_run, null, 2)}`);
      await sendLogs(workflow_run, app.log);
    });
  });

  // Handle workflow_job events. 
  // This is not required for the current implementation as we are able 
  // to get most of the information from the workflow_run event
  app.on('workflow_job', async (context) => {
    const job_id = context.payload.workflow_job.id;
    const job_name = context.payload.workflow_job.name;
    const owner = context.payload.repository.owner.login;
    const repo = context.payload.repository.name;

    //if (context.payload.action === 'completed') {
    // Use the GitHub REST API to retrieve the logs for the workflow run
    const response = await context.octokit.request(
      `GET /repos/${owner}/${repo}/actions/jobs/${job_id}/logs`,
      { headers: { 'X-GitHub-Api-Version': '2022-11-28', 'accept': 'application/vnd.github+json' } }
    );
    const logs = response.data;
    //app.log.debug(logs)

    // Build the event data
    const eventData = {
      event: `workflow_job: ${context.payload.action}`,
      job: {
        sequence: null,
        labelsRequested: null,
        runnerGroupRequested: null,
        runnerGroupMatched: null,
        runnerOS: null,
        runnerImage: null,
        runnerImageProvisioner: null,
        permissions: null,
        jobName: job_name,
        startedAt: null,
        completedAt: null,
        conclusion: context.payload.workflow_job.conclusion
      }
    };

    const workflowLogsEventStream = WorkflowLogsEventStream.createInstance(eventData);
    workflowLogsEventStream.processLogsAsString(logs)

    const workflow_job = context.payload.workflow_job;

    workflow_job.runnerOS = eventData.job.runnerOS;
    workflow_job.runnerImage = eventData.job.runnerImage;
    workflow_job.runnerImageProvisioner = eventData.job.runnerImageProvisioner;
    workflow_job.permissions = eventData.job.permissions;

    // Send the events to Azure Event Hubs
    app.log.info(`Sending event ${JSON.stringify(workflow_job, null, 2)}`);
    await sendJobLogs(workflow_job, app.log);
  });
};

// The logs come as a tar file with multiple files
async function processZipFiles(logs, log) {
  const jobs = []
  return JSZip.loadAsync(Buffer.from(logs)).then(async function (zip) {

    // Parse the logs and build events based on the logs
    for (const [relativePath, file] of Object.entries(zip.files)) {
      log.debug("iterating over", relativePath);

      // Ignore if it is a directory
      if (file.dir)
        continue;

      // Build the event data
      const eventData = {
        event: 'workflow_run',
        relativePath,
        job: {
          jobName: null,
          sequence: null,
          labelsRequested: null,
          runnerGroupRequested: null,
          runnerGroupMatched: null,
          runnerOS: null,
          runnerImage: null,
          runnerImageProvisioner: null,
          permissions: null,
          actions: {},
          startedAt: null,
          completedAt: null,
          conclusion: 'success',
          logs: ''
        },
        step: {
          stepName: null,
          sequence: null,
          action: null,
          run: null,
          startedAt: null,
          completedAt: null,
          conclusion: 'success',
          logs: ''
        }
      };

      const workflowLogsEventStream = WorkflowLogsEventStream.createInstance(eventData);

      // We could write to a file like this "file.nodeStream().pipe(fs.createWriteStream(relativePath))"
      // but we want to parse the logs as we go
      // and build the jobs and steps objects
      const zipFileStream = file.nodeStream().pipe(workflowLogsEventStream);

      // Wait till the stream is finished
      await new Promise((resolve, reject) => {
        log.debug(resolve, reject);
        zipFileStream.on('finish', function () {
          // JSZip generates a readable stream with a "end" event,
          // but since it is a pipe, it is piped here in a writable stream 
          // which emits a "finish" event.
          log.debug(`file ${relativePath} processed`);
          // If this file is a step log, add it to the job
          if (workflowLogsEventStream.isStep) {
            let job = jobs.find(j => j.jobName === workflowLogsEventStream.eventData.job.jobName);
            if (!job) {
              job = {};
              job.jobName = workflowLogsEventStream.eventData.job.jobName;
              job.steps = [];
              jobs.push(job);
            }
            job.steps.push(workflowLogsEventStream.eventData.step);
          }

          if (workflowLogsEventStream.eventData.job.runnerOS) {
            let jobix = jobs.findIndex(j => j.jobName === workflowLogsEventStream.eventData.job.jobName);
            if (jobix === -1) {
              const job = {}
              job.steps = [];
              jobs.push(job);
              jobix = jobs.length - 1;
            }
            let job = jobs[jobix];
            const steps = job.steps;
            job = workflowLogsEventStream.eventData.job;
            job.actions = Object.keys(job.actions);
            job.steps = steps;
            jobs[jobix] = job;
          }

          resolve();
        });
      });
    };
    log.debug('done iterating over files');

    // Sort the jobs and steps by sequence
    jobs.sort((a, b) => a.sequence - b.sequence);
    for (const job of jobs) {
      job.steps.sort((a, b) => a.sequence - b.sequence);
    }

    return { jobs };
  });

}

async function sendJobLogs(workflowRunData, log) {
  if(azureEventHubConnector.isEnabled ) {
    log.info("Sending logs to Azure Event Hubs")
    await azureEventHubConnector.sendLogsToAzureEventHubs(workflowRunData, log);
  }
}

async function sendLogs(workflowRunData, log) {
  if(azureEventHubConnector.isEnabled ) {
    log.info("Sending logs to Azure Event Hubs")
    await azureEventHubConnector.sendLogsToAzureEventHubs(workflowRunData, log);
  }
  if(postgresqlConnector.isEnabled ) {
    log.info("Sending logs to PostgreSQL")
    await postgresqlConnector.sendLogs(workflowRunData, log);
  }
}
