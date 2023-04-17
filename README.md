# Probot application for forwarding GitHub Actions workflow logs
This Probot application can be deployed as an Azure Web App (via docker container) to automatically forward workflow log data from multiple GitHub orgs to a variety of data stores. In general the application listens for a `workflow_run` event in a GitHub repository and then
  * Downloads the logs for the workflow run using the GitHub REST API 
  * Forwards the logs to an Azure Event hub and optionally
    * Azure Postgres 
  * Azure Stream Analytics is used to send Event Hub messages to a Power BI streaming dataset and optionally
    * An Azure Log Analytics Workspace

 Connection strings (and other credentials used for authentication) are stored and retrieved from Configuration Settings (e.g., environment variables) of a given Azure Web App, enabling the application to be easily configured for different environments. 

### Functional Architecture
![image](https://user-images.githubusercontent.com/107562400/231777818-2a43fbb8-d85d-45a4-8313-8441785e4301.png)

### Sample Dashboard
![image](https://user-images.githubusercontent.com/107562400/232624615-63adaa32-cf95-4495-b6b5-070937dd211f.png)

## Background
Data is (and always has been) [the new _soil_](https://www.ted.com/talks/david_mccandless_the_beauty_of_data_visualization). It is now easier than ever to gather insights from data given the improvements in modern data visualization tools. However, it has historically been complex to gather, manipulate, and store large amounts of data. Especially streaming data sources, such as webhooks and CI/CD job logs. This, along with there not yet being rich features supporting the displaying of metrics and insights for Actions usage on GitHub sets the stage for a problem that is
* Large in scale
* Neglected by others
* A feasible area to make progress in

## Requirements
ToDo

### Azure Infrastructure 

1. Create Azure Resource Group
2. Create Azure App Service Plan
3. Create Application Insights
4. Create Azure App Service
5. Create Event Hub Namespace
6. Create Event Hub
7. Create Stream Analytics Job

#### App Service Plan

#### App Service

#### Event Hub Namespace

#### Stream Analytics Job



### Installation
To install this Probot application, follow these steps:
1. Clone this repository to your development environment.
2. Install dependencies by running `npm install` in the root directory of the repository.
3. Create a .env file in the root directory of the repository with the following content:

```
APP_ID=<your GitHub App ID>
PRIVATE_KEY=<your Github App private key>
WEBHOOK_SECRET=<your GitHub App webhook secret> 
```

Replace the values in angle brackets with your own values. You can obtain your GitHub App ID and webhook secret by  [creating a new GitHub App](https://docs.github.com/en/developers/apps/creating-a-github-app). 
