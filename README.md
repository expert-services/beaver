# Probot application for forwarding GitHub Actions workflow logs
This Probot application can be deployed as an Azure Web App (via docker container) to automatically forward workflow log data from a GitHub org to a variety of data stores. In general the application listens for a `workflow_run` event in a GitHub repository and then
  * Downloads the logs for the workflow run using the GitHub REST API 
  * Forwards the logs to an Azure Event hub and optionally a PostgreSQL database 
  * Azure Stream Analytics is used to send Event Hub messages to a Power BI streaming dataset

Connection strings (and other credentials used for authentication) are stored and retrieved from Configuration Settings (e.g., environment variables) of a given Azure Web App, enabling the application to be easily configured for different environments. 

### Functional Architecture
Different environments support the process of shipping and vizualizing workflow log data
- GitHub hosts the Beaver application (this repository), the REST API, as well as the Organization that the GitHub App is installed on
- The infrasturcure required to recieve the GitHub App webhooks and obtain workflow logs exists in Azure and is managed with Terraform
- Data storage requirements and vizualization tools can exist leveraging the Office 365 ecosystem or Open Source components

![image](https://github.com/octodemo/beaver/assets/107562400/60b6c501-52d6-4737-b2ca-405805b9e881)

### Sample Dashboard
![image](https://user-images.githubusercontent.com/107562400/232624615-63adaa32-cf95-4495-b6b5-070937dd211f.png)

## Background
It is now easier than ever to gather insights from data given the improvements in modern data visualization tools. However, it has historically been complex to gather, manipulate, and store large amounts of data. Especially streaming data sources, such as webhooks and CI/CD job logs. This, along with there not yet being rich features supporting the displaying of metrics and insights for Actions usage on GitHub sets the stage for a problem that is
* Large in scale
* Neglected by others
* A feasible area to make progress in

## Requirements
1. A GitHub App must be installed on the Organization that you wish to collect log data for
     - The **GitHub App name** must be supplied with a name (e.g., my-org-beaver)
     - The **Homepage URL** must be provided (e.g., https://github.com/octodemo/beaver )
     - The initial **Webhook URL** must be a temporary one (e.g., https://example.com)
     - A **Webhook secret** must be generated and used
     - It must have **Read-only** to **Actions** as a Repository permission
     - It must be subscribed to the **Workflow run** event
     - It should be installed **Only on this account** (i.e., not on Any account)
2. Generate a **Private key** for the GitHub App and Base64 encode the associated `.pem` file

    ```console
    foo@bar:~$ base64 -i oodles-noodles-beaver.YYYY-MM-DD.private-key.pem
    LS0tLS1CRUdJTiBSU0EgUFJJVkFURSBLRVktLS0tLQpNSUlFb3dJQkFBS0NBUUVBa2xwaVlUdEZQbG5kdWdySDNOcGlvaGNZN1ZwNTlYMkhGTjJXMjZKdHkzYkRJWTJCClpJc20rRGN5dEZNb0kxbUg3UGUvUk1CN0xuOXZLS2N5Sk1kNVRuakxwUTBZWGdCOFRlQzdTa2tHNFB3alZKWlEKK1RlN3hiQUtSTmlocVMyZVMzYzBoQWpwYVJYaGVDb2hSRElvNkZ2NVYrRHR0dWVVUEVYWGI5S3p6d0FETF
    ...
    ...

    foo@bar:~$
    ```
3. Install the GitHub App on all the repositories in the Organization
4. Create a repository to store needed configuration items and deploy required infrastructure
5. Create values the following as **Repository secrets** in the repository created in Step 3
     - **CLIENT_ID**: The client ID of the Azure App Registration used to deploy infrastructure
     - **TENANT_ID**: The tenant ID of the Azure App Registration used to deploy infrastructure
     - **SUBSCRIPTION_ID**: The subscription ID of the Azure subscription that infrastructure is to be deployed to
     - **APP_ID**: The GitHub App ID
     - **WEBHOOK_SECRET**: The Webhook secret specified when creating the GitHub App
     - **PRIVATE_KEY**: The Base64 string associated with the GitHub Apps Private key `.pem` file

## Deploy Azure Infrastructure 
Infrastructure is required to process webhook events, as well as gather and transform GitHub Actions log data. A variety of Azure services are used to provide the needed runtimes, configurations, and storage that allows for easy reporting layers to be integrated.

> **Note**
> In this case it is assumed that a Federated credential for GitHub Actions has been [correctly configured](https://github.com/marketplace/actions/azure-login#configure-a-federated-credential-to-use-oidc-based-authentication).


### Terraform
Use GitHub Actions 🚀 to execute Terraform CLI commands 

1. Copy [terraform/main.tf](terraform/main.tf) into the repository created during Step 3 of the Requirements section
2. Create a separate Azure Storage Account (StorageV2) to maintain the Terraform state
3. Copy the [.github/workflows/deploy_to_azure.yml](.github/workflows/deploy_to_azure.yml) into the repository created during Step 3 of the Requirements section
4. Edit the `locals` parameter to include the GitHub Org that has the GitHub App installed. Additionally, provide a group ID (a UUID) for the PowerBI dataset destination. To obtain a group ID, navigate to a particular Power BI Workspace, and use the UUID immediately after `https://app.powerbi.com/groups/` in the URL of the browser 
5. Create a Container for the Terraform state (e.g., octodemo-tfstate)
6. Edit the `terraform backend` configuration to reference the previously created storage account and container
7. Edit the `azurerm` provider properties to specify the correct `subscription_id`, `tenant_id`, and `client_id`
8. Commit changes to observe the `deploy_to_azure.yml` workflow execute

> **Note**
> If using the [terraform/main.tf](terraform/main.tf) template, resource will be deployed in the East US region

### Local Development
To install this Probot application, follow these steps:
1. Clone this repository to your development environment
2. Install dependencies by running `npm install` in the root directory of the repository
3. Create a .env file in the root directory of the repository with the following content, and replace the values in angle brackets with your own values:
    ```
    APP_ID=<your GitHub App ID> 
    PRIVATE_KEY=<your Github App private key>
    GITHUB_CLIENT_ID=<your Github App client id> 
    GITHUB_CLIENT_SECRET=<your Github app client secret>
    WEBHOOK_SECRET=<your GitHub App webhook secret>

    # Optional environment variables for the Azure Event Hub
    AZURE_EVENT_HUB_CONNECTION_STRING=
    AZURE_EVENT_HUB_NAME=

    # Optional environment variables for the postgresql database
    POSTGRESQL_USER=
    POSTGRESQL_PASSWORD=
    POSTGRESQL_HOST=
    POSTGRESQL_PORT=
    POSTGRESQL_DATABASE=
    ```
 
4. On a terminal run the following command: `npm start`

## Acknowledgements
The code for this application was originally drafted by @enyil and @decyjpher