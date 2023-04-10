# Probot Application for Forwarding GitHub Workflow Logs to Splunk
This is a Probot application that listens for a workflow_run event in a GitHub repository, downloads the logs for the workflow run using the GitHub REST API, and forwards the logs to a Splunk HTTP Event Collector. The Splunk URL and token are retrieved from environment variables, so they can be easily configured for different environments. This program can be deployed as an Azure Function to automatically monitor and forward logs from GitHub workflows to Splunk for further analysis.
### Requirements
To use this Probot application, you’ll need the following:
* A  [GitHub account](https://github.com/)  and repository
* A  [Splunk](https://www.splunk.com/)  account and HTTP Event Collector token
* A development environment with  [Node.js](https://nodejs.org/)  installed
### Installation
To install this Probot application, follow these steps:
1. Clone this repository to your development environment.
2. Install dependencies by running `npm install` in the root directory of the repository.
3. Create a .env file in the root directory of the repository with the following content:
APP_ID=<your GitHub App ID> PRIVATE_KEY=<your Github App private key> GITHUB_CLIENT_ID=<your Github App client id> GITHUB_CLIENT_SECRET=<your Github app client secret> WEBHOOK_SECRET=<your GitHub App webhook secret> SPLUNK_URL=<your Splunk HTTP Event Collector URL> SPLUNK_TOKEN=<your Splunk HTTP Event Collector token>
Replace the values in angle brackets with your own values. You can obtain your GitHub App ID and webhook secret by  [creating a new GitHub App](https://docs.github.com/en/developers/apps/creating-a-github-app) , and your Splunk HTTP Event Collector token by  [creating a new HTTP Event Collector token](https://docs.splunk.com/Documentation/Splunk/8.2.2/Data/UsetheHTTPEventCollector). Probot takes care of most of the configuration for you, so you can leave the other fields blank when creating the GitHub App automatically with Probot on localhost:3000.
4. (optinal) Deploy the application to Azure Functions by running npm run deploy (make sure you have the  [Azure Functions Core Tools](https://docs.microsoft.com/en-us/azure/azure-functions/functions-run-local)  installed).
### Usage
Once the Probot application is installed and deployed, it will automatically listen for workflow_run events in your GitHub repository. Whenever a new workflow run is triggered, the application will download the logs for the run using the GitHub REST API, format the logs for forwarding to Splunk, and forward the logs to your Splunk HTTP Event Collector using an HTTP POST request. You can view the forwarded logs in your Splunk environment by searching for events with the sourcetype github_workflow_logs.

On a terminal run the following command: `npm start`

### Contributing
If you find a bug or have a feature request, please  [create a new issue](https://github.com/githubcustomer/LibertyMutual/issues)  in this repository. We welcome pull requests with bug fixes or new features as well. We welcome pull requests.

### Azure Credentials for Deployment
Here are the general steps to set up a service principal:

Sign in to the Azure portal.
Click on the Azure Active Directory service in the left-hand menu.
Click on the "App registrations" option and then click "New registration."
Enter a name for the application (e.g., "GitHub Actions").
Under "Supported account types," select "Accounts in this organizational directory only."
Under "Redirect URI," select "Web" and enter a redirect URI (e.g., https://localhost:3000).
Click "Register" to create the application.
On the app's overview page, copy the "Application (client) ID" and "Directory (tenant) ID" values. These will be used as the AZURE_CLIENT_ID and AZURE_TENANT_ID environment variables in your workflow.
Click on the "Certificates & secrets" option and then click "New client secret."
Enter a description for the secret and select an expiration period.
Copy the generated value of the secret. This will be used as the AZURE_CLIENT_SECRET environment variable in your workflow.
You will also need to grant the service principal the necessary permissions to deploy resources in your Azure subscription. Here's how to do it:

Go to your Azure subscription in the portal.
Click on "Access control (IAM)" in the left-hand menu.
Click on "Add" and select "Add role assignment."
In the "Add role assignment" panel, select the appropriate role for your service principal (e.g., "Contributor").
Under "Assign access to," select "Azure AD user, group, or service principal."
In the "Select" field, enter the name of the service principal you created earlier and select it from the dropdown.
Click "Save" to grant the role assignment.
Once you have set up the service principal and granted it the necessary permissions, you can set the AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, and AZURE_TENANT_ID environment variables in your workflow to the appropriate values, and GitHub Actions will be able to deploy your Azure Function.