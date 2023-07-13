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
              text: 'INSERT INTO runs (run_id, name, node_id, head_branch, head_sha, path, display_title, run_number, event, status, conclusion, workflow_id, check_suite_id, check_suite_node_id, url, html_url, created_at, updated_at, actor, run_attempt, referenced_workflows, run_started_at, triggering_actor, jobs_url, logs_url, check_suite_url, artifacts_url, cancel_url, rerun_url, previous_attempt_url, workflow_url, repository, head_repository) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33) RETURNING id',
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
                {referenced_workflows: eventData.referenced_workflows},
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
          
            var res = await client.query(runQuery);
            const runId = res.rows[0].id;
            console.info("Inserting job data into PostgreSQL");
            // insert the job data
            // check if 
            for (const jobData of eventData.jobs) {
              const jobQuery = {
                text: 'INSERT INTO jobs (job_id, jobName, sequence, labelsRequested, runnerGroupRequested, runnerGroupMatched, runnerOS, runnerImage, runnerImageProvisioner, permissions, actions, startedAt, completedAt, conclusion, logs, run_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING id',
                values: [
                  jobData.id,
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
                  runId // use the ID of the parent run as the foreign key
                ]
              };
              res = await client.query(jobQuery);
              const jobId = res.rows[0].id;
              console.info("Inserting step data into PostgreSQL");
              // insert the step data
              for (const stepData of jobData.steps) {
                const stepQuery = {
                  text: 'INSERT INTO steps (stepName, sequence, action, run, startedAt, completedAt, conclusion, logs, job_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id',
                  values: [
                    stepData.stepName,
                    stepData.sequence,
                    stepData.action,
                    stepData.run,
                    stepData.startedAt,
                    stepData.completedAt,
                    stepData.conclusion,
                    stepData.logs,
                    jobId // use the ID of the parent job as the foreign key
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
          id SERIAL PRIMARY KEY,
          run_id BIGINT,
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
          job_id BIGINT,
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
            };
            var needMigration = false;
            const checkTableQueries = [
              `
              SELECT data_type 
              FROM information_schema.columns 
              WHERE table_name = 'runs' 
              AND column_name = 'id';
              `,
              `
              SELECT data_type 
              FROM information_schema.columns 
              WHERE table_name = 'jobs' 
              AND column_name = 'id';
              `
          ];
        
          try {
              const results = await Promise.all(checkTableQueries.map(query => client.query(query)));
              // If the data_type of 'id' column in either 'runs' or 'jobs' table is 'bigint', then migration is needed
              needMigration = results.some(result => result.rows[0].data_type === 'bigint');
          } catch (err) {
              console.error('Error checking tables:', err);
              needMigration = false;
          }
          if (needMigration) {
                // Begin transaction
                await client.query('BEGIN');
                try {
                    // Create temporary tables with new schema
                    const createTempTablesQueries = [
                        `
                        CREATE TABLE runs_temp AS TABLE runs WITH NO DATA;
                        ALTER TABLE runs_temp DROP COLUMN id;
                        ALTER TABLE runs_temp ADD COLUMN id SERIAL PRIMARY KEY;
                        ALTER TABLE runs_temp ADD COLUMN run_id BIGINT;
                        `,
                        `
                        CREATE TABLE jobs_temp AS TABLE jobs WITH NO DATA;
                        ALTER TABLE jobs_temp DROP COLUMN id;
                        ALTER TABLE jobs_temp ADD COLUMN id SERIAL PRIMARY KEY;
                        ALTER TABLE jobs_temp ADD COLUMN job_id BIGINT;
                        `,
                        `
                        CREATE TABLE steps_temp AS TABLE steps WITH NO DATA;
                        `
                    ];

                    for (const query of createTempTablesQueries) {
                        await client.query(query);
                    }

                    // Copy data from the old tables to the new ones with new mapping
                    await client.query(`
                        INSERT INTO runs_temp (run_id, name, node_id, head_branch, head_sha, path, display_title, run_number, event, status, conclusion, workflow_id, check_suite_id, check_suite_node_id, url, html_url, created_at, updated_at, actor, run_attempt, referenced_workflows, run_started_at, triggering_actor, jobs_url, logs_url, check_suite_url, artifacts_url, cancel_url, rerun_url, previous_attempt_url, workflow_url, repository, head_repository) 
                        SELECT id, name, node_id, head_branch, head_sha, path, display_title, run_number, event, status, conclusion, workflow_id, check_suite_id, check_suite_node_id, url, html_url, created_at, updated_at, actor, run_attempt, referenced_workflows, run_started_at, triggering_actor, jobs_url, logs_url, check_suite_url, artifacts_url, cancel_url, rerun_url, previous_attempt_url, workflow_url, repository, head_repository
                        FROM runs;
                    `);

                    await client.query(`
                        INSERT INTO jobs_temp (job_id, run_id, jobName, sequence, labelsRequested, runnerGroupRequested, runnerGroupMatched, runnerOS, runnerImage, runnerImageProvisioner, permissions, actions, startedAt, completedAt, conclusion, logs ) 
                        SELECT jobs.id, runs_temp.id, jobs.jobName, jobs.sequence, jobs.labelsRequested, jobs.runnerGroupRequested, jobs.runnerGroupMatched, jobs.runnerOS, jobs.runnerImage, jobs.runnerImageProvisioner, jobs.permissions, jobs.actions, jobs.startedAt, jobs.completedAt, jobs.conclusion, jobs.logs
                        FROM jobs 
                        JOIN runs_temp ON runs_temp.run_id = jobs.run_id;
                    `);

                    await client.query(`
                        INSERT INTO steps_temp (job_id, stepName, sequence, action, run, startedAt, completedAt, conclusion, logs)
                        SELECT jobs_temp.id, steps.stepName, steps.sequence, steps.action, steps.run, steps.startedAt, steps.completedAt, steps.conclusion, steps.logs
                        FROM steps 
                        JOIN jobs_temp ON jobs_temp.job_id = steps.job_id;
                    `);

                    const runsTablePermissions = await client.query(`
                        SELECT grantee, privilege_type
                        FROM information_schema.table_privileges
                        WHERE table_name = $1;
                    `, ['runs']);

                    const jobsTablePermissions = await client.query(`
                        SELECT grantee, privilege_type
                        FROM information_schema.table_privileges
                        WHERE table_name = $1;
                    `, ['jobs']);

                    const stepsTablePermissions = await client.query(`
                        SELECT grantee, privilege_type
                        FROM information_schema.table_privileges
                        WHERE table_name = $1;
                    `, ['steps']);

                    await client.query(`
                        ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_run_id_fkey;
                        ALTER TABLE steps DROP CONSTRAINT IF EXISTS steps_job_id_fkey;
                    `);

                    // Drop the old tables
                    const dropOldTablesQueries = [
                        `DROP TABLE runs;`,
                        `DROP TABLE jobs;`,
                        `DROP TABLE steps;`
                    ];

                    for (const query of dropOldTablesQueries) {
                        await client.query(query);
                    }

                    // Rename the new tables to the original names
                    const renameTablesQueries = [
                        `ALTER TABLE runs_temp RENAME TO runs;`,
                        `ALTER TABLE jobs_temp RENAME TO jobs;`,
                        `ALTER TABLE steps_temp RENAME TO steps;`
                    ];

                    for (const query of renameTablesQueries) {
                        await client.query(query);
                    }

                    try {
                      // Set the permissions of the new tables
                      for (const { grantee, privilege_type } of runsTablePermissions.rows) {
                        await client.query(`GRANT ${privilege_type} ON runs TO ${grantee};`);
                      }
                      for (const { grantee, privilege_type } of jobsTablePermissions.rows) {
                          await client.query(`GRANT ${privilege_type} ON jobs TO ${grantee};`);
                      }
                      for (const { grantee, privilege_type } of stepsTablePermissions.rows) {
                          await client.query(`GRANT ${privilege_type} ON steps TO ${grantee};`);
                      }
                    } catch (err) {
                      console.error('error migrating permissions, might need to create manually.', err);
                    }

                    // Commit transaction
                    await client.query('COMMIT');
                } catch (err) {
                    await client.query('ROLLBACK');
                    throw err;
                }
          }
        } catch (err) {
            ;
            console.error('Error creating tables:', err);
            return false;
        }
        return true;
    }

    async needMigration(client) {
      
  }

  async migrateTables(client) {
    // Begin transaction
    await client.query('BEGIN');

    try {
        // Create temporary tables with new schema
        const createTempTablesQueries = [
            `
            CREATE TABLE runs_temp AS TABLE runs WITH NO DATA;
            ALTER TABLE runs_temp DROP COLUMN id;
            ALTER TABLE runs_temp ADD COLUMN id SERIAL PRIMARY KEY;
            ALTER TABLE runs_temp ADD COLUMN run_id BIGINT;
            `,
            `
            CREATE TABLE jobs_temp AS TABLE jobs WITH NO DATA;
            ALTER TABLE jobs_temp DROP COLUMN id;
            ALTER TABLE jobs_temp ADD COLUMN id SERIAL PRIMARY KEY;
            ALTER TABLE jobs_temp ADD COLUMN job_id BIGINT;
            `,
            `
            CREATE TABLE steps_temp AS TABLE steps WITH NO DATA;
            `
        ];

        for (const query of createTempTablesQueries) {
            await client.query(query);
        }

        // Copy data from the old tables to the new ones with new mapping
        await client.query(`
            INSERT INTO runs_temp (run_id, name /* rest of fields */) 
            SELECT id, name /* rest of fields */ 
            FROM runs;
        `);

        await client.query(`
            INSERT INTO jobs_temp (job_id, run_id, jobName /* rest of fields */) 
            SELECT jobs.id, runs_temp.id, jobs.jobName /* rest of fields */ 
            FROM jobs 
            JOIN runs_temp ON runs_temp.run_id = jobs.run_id;
        `);

        await client.query(`
            INSERT INTO steps_temp (job_id, stepName /* rest of fields */) 
            SELECT jobs_temp.id, steps.stepName /* rest of fields */ 
            FROM steps 
            JOIN jobs_temp ON jobs_temp.job_id = steps.job_id;
        `);

        // Drop the old tables
        const dropOldTablesQueries = [
            `DROP TABLE runs;`,
            `DROP TABLE jobs;`,
            `DROP TABLE steps;`
        ];

        for (const query of dropOldTablesQueries) {
            await client.query(query);
        }

        // Rename the new tables to the original names
        const renameTablesQueries = [
            `ALTER TABLE runs_temp RENAME TO runs;`,
            `ALTER TABLE jobs_temp RENAME TO jobs;`,
            `ALTER TABLE steps_temp RENAME TO steps;`
        ];

        for (const query of renameTablesQueries) {
            await client.query(query);
        }

        // Commit transaction
        await client.query('COMMIT');
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    }
}

}

module.exports = PostgreSQLConnector;
