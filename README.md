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
1. A GitHub App must be installed and configured on each Organization 

### Azure Infrastructure 
Infrastructure is required to process webhook events, as well as gather and transform GitHub Actions log data. A variety of Azure services are used to provide the needed runtimes, configurations, and storage that allows for easy reporting layers to be integrated.

#### Terraform
Terraform can be used to automatically deploy the required infrastructure. 

1. Navigate to or create a directory that will contain the Terraform state information, and initialize the directory by using the `terraform init` command
2. Copy [terraform/main.tf](terraform/main.tf) into the working directory
3. Adjust the `locals` parameter to include the GitHub Orgs that have GitHub Apps installed. Additionally, provide a group ID (a UUID) for the PowerBI dataset destination. To obtain a group ID, navigate to a particular Power BI Workspace, and use the UUID immediately after `https://app.powerbi.com/groups/` in the URL of the browser  
4. Login to Azure using the `az login` command (assuming you have the `az cli` installed)
5. Use the `terraform plan` command to create a plan for the infrastructure that will be created, and inspect it if desired
6. Use the `terraform apply` command to deploy the infrastructure

> **Note**
> If using the [terraform/main.tf](terraform/main.tf) template, resource will be deployed in the East US region

Do all of the above using GitHub Actions 🚀. The [.github/workflows/deploy_to_azure.yml](.github/workflows/deploy_to_azure.yml) provides an example of how to do this. Note that in this case it is assumed that a Federated credential for GitHub Actions has been [correctly configured](https://github.com/marketplace/actions/azure-login#configure-a-federated-credential-to-use-oidc-based-authentication).

7. Fill in correct values for App Service Configuration settings
8. 

#### App Service Plan

#### App Service

#### Event Hub Namespace

#### Stream Analytics Job



### Local Installation
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

## Acknowledgements
The code for this application was originally drafted by @enyil and @decyjpher, and I have merely stood on their gigantic shoulders by centralizing efforts in this repository.
