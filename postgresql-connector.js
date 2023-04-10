// PostgreSQL Connector class 
const { Client } = require('pg');


class PostgreSQLConnector {

    constructor() {
        // check if the required environment variables are set, if are not, log an info message once and disable the connector.
        // do it else if, so that the first missing variable is logged only. check for null or empty
        if (process.env.POSTGRESQL_USER == null || process.env.POSTGRESQL_USER == "") {
            console.log("POSTGRESQL_USER environment variable is not set. Disabling PostgreSQL connector.");
            this.isEnabled = false;
        } else if (process.env.POSTGRESQL_PASSWORD == null || process.env.POSTGRESQL_PASSWORD == "") {
            console.log("POSTGRESQL_PASSWORD environment variable is not set. Disabling PostgreSQL connector.");
            this.isEnabled = false;
        } else if (process.env.POSTGRESQL_HOST == null || process.env.POSTGRESQL_HOST == "") {
            console.log("POSTGRESQL_HOST environment variable is not set. Disabling PostgreSQL connector.");
            this.isEnabled = false;
        } else if (process.env.POSTGRESQL_PORT == null || process.env.POSTGRESQL_PORT == "") {
            console.log("POSTGRESQL_PORT environment variable is not set. Disabling PostgreSQL connector.");
            this.isEnabled = false;
        } else if (process.env.POSTGRESQL_DATABASE == null || process.env.POSTGRESQL_DATABASE == "") {
            console.log("POSTGRESQL_DATABASE environment variable is not set. Disabling PostgreSQL connector.");
            this.isEnabled = false;
        } else {
            this.postgres_ssl = true;
            if(process.env.POSTGRESQL_SSL != null && process.env.POSTGRESQL_SSL != "" && process.env.POSTGRESQL_SSL == "false") {
                this.postgres_ssl = false;
            }
            this.postgresUser = process.env.POSTGRESQL_USER;
            this.postgresPassword = process.env.POSTGRESQL_PASSWORD;
            this.postgresHost = process.env.POSTGRESQL_HOST;
            this.postgresPort = process.env.POSTGRESQL_PORT;
            this.postgresDatabase = process.env.POSTGRESQL_DATABASE;
            // check if the connection is valid
            console.log("checking PostgreSQL connection is valid...");
            this.isEnabled = this.validateConnection();
            if (!this.isEnabled) {
                console.log("PostgreSQL connection could not be established. Disabling PostgreSQL connector.");
                return;
            } else {
                console.log("PostgreSQL connection is valid.");
            }
            console.log("checking PostgreSQL tables exist...");
            this.isEnabled = this.createTables();
            if (!this.isEnabled) {
                console.log("PostgreSQL database does not have the required tables. Disabling PostgreSQL connector.");
                return;
            } else {
                console.log("PostgreSQL tables exist.");
            }
            console.log("PostgreSQL connector is enabled.");
        }
    }

    // creates a new client and connects to the database
    createClient() {
        const client = new Client({
            user: this.postgresUser,
            password: this.postgresPassword,
            host: this.postgresHost,
            port: this.postgresPort,
            database: this.postgresDatabase,
            ssl: this.postgres_ssl
        });
        client.connect();
        return client;
    }

    // checks if the required fields are set and if the connection is valid by trying to connect to the database
    validateConnection() {
        try {
            this.createClient();
            return true;
        } catch (err) {
            console.log(err);
            return false;
        }
    }

    async sendLogs(eventData, log) {
        if (!this.isEnabled) {
            return;
        }
        const client = this.createClient();
        try {
            // insert the run data
            console.info("Inserting run data into PostgreSQL");
            const runQuery = {
              text: 'INSERT INTO runs (id, name, node_id, head_branch, head_sha, path, display_title, run_number, event, status, conclusion, workflow_id, check_suite_id, check_suite_node_id, url, html_url, created_at, updated_at, actor, run_attempt, referenced_workflows, run_started_at, triggering_actor, jobs_url, logs_url, check_suite_url, artifacts_url, cancel_url, rerun_url, previous_attempt_url, workflow_url, repository, head_repository) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33)',
              values: [
                eventData.id,
                eventData.name,
                eventData.node_id,
                eventData.head_branch,
                eventData.head_sha,
                eventData.path,
                eventData.display_title,
                eventData.run_number,
                eventData.event,
                eventData.status,
                eventData.conclusion,
                eventData.workflow_id,
                eventData.check_suite_id,
                eventData.check_suite_node_id,
                eventData.url,
                eventData.html_url,
                eventData.created_at,
                eventData.updated_at,
                eventData.actor,
                eventData.run_attempt,
                eventData.referenced_workflows,
                eventData.run_started_at,
                eventData.triggering_actor,
                eventData.jobs_url,
                eventData.logs_url,
                eventData.check_suite_url,
                eventData.artifacts_url,
                eventData.cancel_url,
                eventData.rerun_url,
                eventData.previous_attempt_url,
                eventData.workflow_url,
                eventData.repository,
                eventData.head_repository
              ]
            };
            await client.query(runQuery);
            console.info("Inserting job data into PostgreSQL");
            // insert the job data
            for (const jobData of eventData.jobs) {
              const jobQuery = {
                text: 'INSERT INTO jobs (jobName, sequence, labelsRequested, runnerGroupRequested, runnerGroupMatched, runnerOS, runnerImage, runnerImageProvisioner, permissions, actions, startedAt, completedAt, conclusion, logs, run_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)',
                values: [
                  jobData.jobName,
                  jobData.sequence,
                  jobData.labelsRequested,
                  jobData.runnerGroupRequested,
                  jobData.runnerGroupMatched,
                  jobData.runnerOS,
                  jobData.runnerImage,
                  jobData.runnerImageProvisioner,
                  jobData.permissions,
                  jobData.actions,
                  jobData.startedAt,
                  jobData.completedAt,
                  jobData.conclusion,
                  jobData.logs,
                  eventData.id // use the ID of the parent run as the foreign key
                ]
              };
              await client.query(jobQuery);
              console.info("Inserting step data into PostgreSQL");
              // insert the step data
              for (const stepData of jobData.steps) {
                const stepQuery = {
                  text: 'INSERT INTO steps (stepName, sequence, action, run, startedAt, completedAt, conclusion, logs, job_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
                  values: [
                    stepData.stepName,
                    stepData.sequence,
                    stepData.action,
                    stepData.run,
                    stepData.startedAt,
                    stepData.completedAt,
                    stepData.conclusion,
                    stepData.logs,
                    jobData.id // use the ID of the parent job as the foreign key
                  ]
                };
                await client.query(stepQuery);
              }
            }
            console.log(`Event data with ID ${eventData.id} has been inserted successfully.`);
          } catch (err) {
            console.error(`Error while inserting event data with ID ${eventData.id}: ${err}`);
          }
    }

    async checkTablesExist() {
        const client = this.createClient();
        const runsTableQuery = `
        SELECT to_regclass('public.runs');
        `;

        const jobsTableQuery = `
        SELECT to_regclass('public.jobs');
        `;

        const stepsTableQuery = `
        SELECT to_regclass('public.steps');
        `;
        try {
            const runsTableResult = await client.query(runsTableQuery);
            const jobsTableResult = await client.query(jobsTableQuery);
            const stepsTableResult = await client.query(stepsTableQuery);
            ;
            const runsTableExists = runsTableResult.rows[0].to_regclass !== null;
            const jobsTableExists = jobsTableResult.rows[0].to_regclass !== null;
            const stepsTableExists = stepsTableResult.rows[0].to_regclass !== null;

            return { runsTableExists, jobsTableExists, stepsTableExists };
        } catch (err) {
            ;
            console.error('Error checking tables:', err);
            return { runsTableExists: false, jobsTableExists: false, stepsTableExists: false };
        }
    }

     // check if the tables runs, jobs, and steps exist, if not, create them.
     async createTables() {
        if (!this.isEnabled) {
            return;
        }
        const runsTableQuery = `
        CREATE TABLE IF NOT EXISTS runs (
          id BIGINT PRIMARY KEY,
          name TEXT,
          node_id TEXT,
          head_branch TEXT,
          head_sha TEXT,
          path TEXT,
          display_title TEXT,
          run_number INTEGER,
          event TEXT,
          status TEXT,
          conclusion TEXT,
          workflow_id BIGINT,
          check_suite_id BIGINT,
          check_suite_node_id TEXT,
          url TEXT,
          html_url TEXT,
          created_at TIMESTAMP WITH TIME ZONE,
          updated_at TIMESTAMP WITH TIME ZONE,
          actor TEXT,
          run_attempt INTEGER,
          referenced_workflows JSONB,
          run_started_at TIMESTAMP WITH TIME ZONE,
          triggering_actor TEXT,
          jobs_url TEXT,
          logs_url TEXT,
          check_suite_url TEXT,
          artifacts_url TEXT,
          cancel_url TEXT,
          rerun_url TEXT,
          previous_attempt_url TEXT,
          workflow_url TEXT,
          repository TEXT,
          head_repository TEXT
        );
      `;
      
      const jobsTableQuery = `
        CREATE TABLE IF NOT EXISTS jobs (
          id SERIAL PRIMARY KEY,
          jobName TEXT,
          sequence INTEGER,
          labelsRequested TEXT,
          runnerGroupRequested TEXT,
          runnerGroupMatched TEXT,
          runnerOS TEXT,
          runnerImage TEXT,
          runnerImageProvisioner TEXT,
          permissions JSONB,
          actions TEXT[],
          startedAt TIMESTAMP WITH TIME ZONE,
          completedAt TIMESTAMP WITH TIME ZONE,
          conclusion TEXT,
          logs TEXT,
          run_id BIGINT REFERENCES runs(id)
        );
      `;
      
      const stepsTableQuery = `
        CREATE TABLE IF NOT EXISTS steps (
          id SERIAL PRIMARY KEY,
          stepName TEXT,
          sequence INTEGER,
          action TEXT,
          run TEXT,
          startedAt TIMESTAMP WITH TIME ZONE,
          completedAt TIMESTAMP WITH TIME ZONE,
          conclusion TEXT,
          logs TEXT,
          job_id INTEGER REFERENCES jobs(id)
        );
      `;
        // calls checkTablesExist() to check if the tables exist, if not, create them
        const { runsTableExists, jobsTableExists, stepsTableExists } = await this.checkTablesExist();
        const client = await this.createClient();
        try {
            if(!runsTableExists) {
                await client.query(runsTableQuery);
                console.log('runs table created');
            }
            if(!jobsTableExists) {
                await client.query(jobsTableQuery);
                console.log('jobs table created');
            }
            if(!stepsTableExists) {
                await client.query(stepsTableQuery);
                console.log('steps table created');
            }
            ;
        } catch (err) {
            ;
            console.error('Error creating tables:', err);
            return false;
        }
        return true;
    }
}

module.exports = PostgreSQLConnector;