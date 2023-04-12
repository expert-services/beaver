# Probot application for forwarding logs
This is a Probot application that listens for a `workflow_run` event in a GitHub repository, downloads the logs for the workflow run using the GitHub REST API, and forwards the logs to an Azure Event Hub. This Probot application be deployed as an Azure Web App to automatically monitor and forward logs from multiple GitHub orgs a variety of data stores to be viewed with various data visualization programs. The Azure Event Hub connection string (and other credentials used for authentication) are retrieved from Configuration Settings (environment variables) of the Azure Web App, so they can be easily configured for different environments. 

![image](https://user-images.githubusercontent.com/107562400/231469457-121b66c2-ab50-42dd-a4da-e7dce2bf37ad.png)

### Requirements
To use this Probot application, you’ll need the following:
* ToDo

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
