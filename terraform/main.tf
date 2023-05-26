terraform {
  backend "azurerm" {
    resource_group_name  = "tf-state"
    storage_account_name = "beaverstate"
    container_name       = "octodemo-tfstate"
    key                  = "prod.terraform.tfstate"
    use_oidc             = true
    subscription_id      = "24edc3b6-c013-4246-a10d-a237e66a863c"
    tenant_id            = "5fe9aea4-03da-41b3-9703-c7aecd10de63"
    client_id            = "3d9d2c4a-caf0-482b-ac57-ea734414f596"
  }
}

terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "3.7.0"
    }
  }
}

provider "azurerm" {
  use_oidc        = true
  subscription_id = "24edc3b6-c013-4246-a10d-a237e66a863c"
  tenant_id       = "5fe9aea4-03da-41b3-9703-c7aecd10de63"
  client_id       = "3d9d2c4a-caf0-482b-ac57-ea734414f596"
  features {}
}

locals { 
  org = "octodemo"

  powerbi_config = {
    dataset    = "actions-workflow-data"
    table      = "data"
    group_id   = "9c393c4a-dd2e-4f22-a007-0e41cb7fff85"
    group_name = "github-services"
  }

  docker_config = {
    image = "yjactionsmetrics.azurecr.io/beaver"
    tag   = "latest"
  }
}

resource "azurerm_resource_group" "beaver" {
  name     = "beaver"
  location = "eastus"
}

resource "azurerm_service_plan" "beaver-asp" {
  name                = "beaver-appserviceplan"
  location            = azurerm_resource_group.beaver.location
  resource_group_name = azurerm_resource_group.beaver.name
  os_type             = "Linux"
  sku_name            = "P1v3"
}

resource "azurerm_eventhub_namespace" "beaver" {
  name                = "beaver-eventhub-ns"
  location            = azurerm_resource_group.beaver.location
  resource_group_name = azurerm_resource_group.beaver.name
  sku                 = "Standard"
  capacity            = 1
}

resource "azurerm_eventhub" "beaver" {
  name                = "beaver-eventhub"
  namespace_name      = azurerm_eventhub_namespace.beaver.name
  resource_group_name = azurerm_resource_group.beaver.name
  partition_count     = 2
  message_retention   = 1
}

# Create needed UUIDs for Azure Stream Analytics query
resource "random_uuid" "input" {}
resource "random_uuid" "output" {}
resource "random_uuid" "transform1" {}
resource "random_uuid" "transform2" {}
resource "random_uuid" "transform3" {}
resource "random_uuid" "transform4" {}
resource "random_uuid" "transform5" {}
resource "random_uuid" "transform6" {}

resource "azurerm_stream_analytics_job" "beaver" {
  name                = "beaver-sa-job"
  location            = azurerm_resource_group.beaver.location
  resource_group_name = azurerm_resource_group.beaver.name
  streaming_units     = 3

  transformation_query = <<QUERY
  WITH

  [${random_uuid.input.result}] AS (
  SELECT
      TRY_CAST([${random_uuid.input.result}-input].[previous_attempt_url] AS record) AS [previous_attempt_url],
      TRY_CAST([${random_uuid.input.result}-input].[head_commit] AS record) AS [head_commit],
      TRY_CAST([${random_uuid.input.result}-input].[pull_requests] AS array) AS [pull_requests],
      TRY_CAST([${random_uuid.input.result}-input].[referenced_workflows] AS array) AS [referenced_workflows],
      TRY_CAST([${random_uuid.input.result}-input].[jobs] AS array) AS [jobs],
      TRY_CAST([${random_uuid.input.result}-input].[id] AS float) AS [id],
      TRY_CAST([${random_uuid.input.result}-input].[name] AS nvarchar(max)) AS [name],
      TRY_CAST([${random_uuid.input.result}-input].[node_id] AS nvarchar(max)) AS [node_id],
      TRY_CAST([${random_uuid.input.result}-input].[head_branch] AS nvarchar(max)) AS [head_branch],
      TRY_CAST([${random_uuid.input.result}-input].[head_sha] AS nvarchar(max)) AS [head_sha],
      TRY_CAST([${random_uuid.input.result}-input].[path] AS nvarchar(max)) AS [path],
      TRY_CAST([${random_uuid.input.result}-input].[display_title] AS nvarchar(max)) AS [display_title],
      TRY_CAST([${random_uuid.input.result}-input].[run_number] AS bigint) AS [run_number],
      TRY_CAST([${random_uuid.input.result}-input].[event] AS nvarchar(max)) AS [event],
      TRY_CAST([${random_uuid.input.result}-input].[status] AS nvarchar(max)) AS [status],
      TRY_CAST([${random_uuid.input.result}-input].[conclusion] AS nvarchar(max)) AS [conclusion],
      TRY_CAST([${random_uuid.input.result}-input].[workflow_id] AS bigint) AS [workflow_id],
      TRY_CAST([${random_uuid.input.result}-input].[check_suite_id] AS float) AS [check_suite_id],
      TRY_CAST([${random_uuid.input.result}-input].[check_suite_node_id] AS nvarchar(max)) AS [check_suite_node_id],
      TRY_CAST([${random_uuid.input.result}-input].[url] AS nvarchar(max)) AS [url],
      TRY_CAST([${random_uuid.input.result}-input].[html_url] AS nvarchar(max)) AS [html_url],
      TRY_CAST([${random_uuid.input.result}-input].[created_at] AS datetime) AS [created_at],
      TRY_CAST([${random_uuid.input.result}-input].[updated_at] AS datetime) AS [updated_at],
      TRY_CAST([${random_uuid.input.result}-input].[actor] AS nvarchar(max)) AS [actor],
      TRY_CAST([${random_uuid.input.result}-input].[run_attempt] AS bigint) AS [run_attempt],
      TRY_CAST([${random_uuid.input.result}-input].[run_started_at] AS nvarchar(max)) AS [run_started_at],
      TRY_CAST([${random_uuid.input.result}-input].[triggering_actor] AS nvarchar(max)) AS [triggering_actor],
      TRY_CAST([${random_uuid.input.result}-input].[jobs_url] AS nvarchar(max)) AS [jobs_url],
      TRY_CAST([${random_uuid.input.result}-input].[logs_url] AS nvarchar(max)) AS [logs_url],
      TRY_CAST([${random_uuid.input.result}-input].[check_suite_url] AS nvarchar(max)) AS [check_suite_url],
      TRY_CAST([${random_uuid.input.result}-input].[artifacts_url] AS nvarchar(max)) AS [artifacts_url],
      TRY_CAST([${random_uuid.input.result}-input].[cancel_url] AS nvarchar(max)) AS [cancel_url],
      TRY_CAST([${random_uuid.input.result}-input].[rerun_url] AS nvarchar(max)) AS [rerun_url],
      TRY_CAST([${random_uuid.input.result}-input].[workflow_url] AS nvarchar(max)) AS [workflow_url],
      TRY_CAST([${random_uuid.input.result}-input].[repository] AS nvarchar(max)) AS [repository],
      TRY_CAST([${random_uuid.input.result}-input].[head_repository] AS nvarchar(max)) AS [head_repository],
      TRY_CAST([${random_uuid.input.result}-input].[EventProcessedUtcTime] AS datetime) AS [EventProcessedUtcTime],
      TRY_CAST([${random_uuid.input.result}-input].[PartitionId] AS bigint) AS [PartitionId],
      TRY_CAST([${random_uuid.input.result}-input].[EventEnqueuedUtcTime] AS datetime) AS [EventEnqueuedUtcTime]
  FROM [${random_uuid.input.result}-input]
  ),

  [${random_uuid.transform1.result}] AS (
  SELECT
      [${random_uuid.transform2.result}].[ArrayIndex] AS [ArrayIndex_jobs],
      [${random_uuid.transform2.result}].[ArrayValue] AS [ArrayValue_jobs],
      [${random_uuid.input.result}].[previous_attempt_url],
      [${random_uuid.input.result}].[head_commit],
      [${random_uuid.input.result}].[pull_requests],
      [${random_uuid.input.result}].[referenced_workflows],
      [${random_uuid.input.result}].[jobs],
      [${random_uuid.input.result}].[id],
      [${random_uuid.input.result}].[name],
      [${random_uuid.input.result}].[node_id],
      [${random_uuid.input.result}].[head_branch],
      [${random_uuid.input.result}].[head_sha],
      [${random_uuid.input.result}].[path],
      [${random_uuid.input.result}].[display_title],
      [${random_uuid.input.result}].[run_number],
      [${random_uuid.input.result}].[event],
      [${random_uuid.input.result}].[status],
      [${random_uuid.input.result}].[conclusion],
      [${random_uuid.input.result}].[workflow_id],
      [${random_uuid.input.result}].[check_suite_id],
      [${random_uuid.input.result}].[check_suite_node_id],
      [${random_uuid.input.result}].[url],
      [${random_uuid.input.result}].[html_url],
      [${random_uuid.input.result}].[created_at],
      [${random_uuid.input.result}].[updated_at],
      [${random_uuid.input.result}].[actor],
      [${random_uuid.input.result}].[run_attempt],
      [${random_uuid.input.result}].[run_started_at],
      [${random_uuid.input.result}].[triggering_actor],
      [${random_uuid.input.result}].[jobs_url],
      [${random_uuid.input.result}].[logs_url],
      [${random_uuid.input.result}].[check_suite_url],
      [${random_uuid.input.result}].[artifacts_url],
      [${random_uuid.input.result}].[cancel_url],
      [${random_uuid.input.result}].[rerun_url],
      [${random_uuid.input.result}].[workflow_url],
      [${random_uuid.input.result}].[repository],
      [${random_uuid.input.result}].[head_repository],
      [${random_uuid.input.result}].[EventProcessedUtcTime],
      [${random_uuid.input.result}].[PartitionId],
      [${random_uuid.input.result}].[EventEnqueuedUtcTime]
  FROM [${random_uuid.input.result}]
  CROSS APPLY GetArrayElements([${random_uuid.input.result}].[jobs]) AS [${random_uuid.transform2.result}]
  ),

  [${random_uuid.transform4.result}] AS (
  SELECT
      [${random_uuid.transform1.result}].[ArrayIndex_jobs] AS [ArrayIndex_jobs],
      [${random_uuid.transform1.result}].[ArrayValue_jobs] AS [ArrayValue_jobs],
      [${random_uuid.transform1.result}].[previous_attempt_url] AS [previous_attempt_url],
      [${random_uuid.transform1.result}].[head_commit] AS [head_commit],
      [${random_uuid.transform1.result}].[pull_requests] AS [pull_requests],
      [${random_uuid.transform1.result}].[referenced_workflows] AS [referenced_workflows],
      [${random_uuid.transform1.result}].[jobs] AS [jobs],
      [${random_uuid.transform1.result}].[id] AS [id],
      [${random_uuid.transform1.result}].[name] AS [name],
      [${random_uuid.transform1.result}].[node_id] AS [node_id],
      [${random_uuid.transform1.result}].[head_branch] AS [head_branch],
      [${random_uuid.transform1.result}].[head_sha] AS [head_sha],
      [${random_uuid.transform1.result}].[path] AS [path],
      [${random_uuid.transform1.result}].[display_title] AS [display_title],
      [${random_uuid.transform1.result}].[run_number] AS [run_number],
      [${random_uuid.transform1.result}].[event] AS [event],
      [${random_uuid.transform1.result}].[status] AS [status],
      [${random_uuid.transform1.result}].[conclusion] AS [conclusion],
      [${random_uuid.transform1.result}].[workflow_id] AS [workflow_id],
      [${random_uuid.transform1.result}].[check_suite_id] AS [check_suite_id],
      [${random_uuid.transform1.result}].[check_suite_node_id] AS [check_suite_node_id],
      [${random_uuid.transform1.result}].[url] AS [url],
      [${random_uuid.transform1.result}].[html_url] AS [html_url],
      [${random_uuid.transform1.result}].[created_at] AS [created_at],
      [${random_uuid.transform1.result}].[updated_at] AS [updated_at],
      [${random_uuid.transform1.result}].[actor] AS [actor],
      [${random_uuid.transform1.result}].[run_attempt] AS [run_attempt],
      [${random_uuid.transform1.result}].[run_started_at] AS [run_started_at],
      [${random_uuid.transform1.result}].[triggering_actor] AS [triggering_actor],
      [${random_uuid.transform1.result}].[jobs_url] AS [jobs_url],
      [${random_uuid.transform1.result}].[logs_url] AS [logs_url],
      [${random_uuid.transform1.result}].[check_suite_url] AS [check_suite_url],
      [${random_uuid.transform1.result}].[artifacts_url] AS [artifacts_url],
      [${random_uuid.transform1.result}].[cancel_url] AS [cancel_url],
      [${random_uuid.transform1.result}].[rerun_url] AS [rerun_url],
      [${random_uuid.transform1.result}].[workflow_url] AS [workflow_url],
      [${random_uuid.transform1.result}].[repository] AS [repository],
      [${random_uuid.transform1.result}].[head_repository] AS [head_repository],
      [${random_uuid.transform1.result}].[EventProcessedUtcTime] AS [EventProcessedUtcTime],
      [${random_uuid.transform1.result}].[PartitionId] AS [PartitionId],
      [${random_uuid.transform1.result}].[EventEnqueuedUtcTime] AS [EventEnqueuedUtcTime],
      CAST([${random_uuid.transform1.result}].[ArrayValue_jobs].[steps] AS array) AS [jobSteps]
  FROM [${random_uuid.transform1.result}]
  ),

  [${random_uuid.transform3.result}] AS (
  SELECT
      [${random_uuid.transform5.result}].[ArrayIndex] AS [ArrayIndex_jobSteps],
      [${random_uuid.transform5.result}].[ArrayValue] AS [ArrayValue_jobSteps],
      [${random_uuid.transform4.result}].[ArrayIndex_jobs],
      [${random_uuid.transform4.result}].[ArrayValue_jobs],
      [${random_uuid.transform4.result}].[previous_attempt_url],
      [${random_uuid.transform4.result}].[head_commit],
      [${random_uuid.transform4.result}].[pull_requests],
      [${random_uuid.transform4.result}].[referenced_workflows],
      [${random_uuid.transform4.result}].[jobs],
      [${random_uuid.transform4.result}].[id],
      [${random_uuid.transform4.result}].[name],
      [${random_uuid.transform4.result}].[node_id],
      [${random_uuid.transform4.result}].[head_branch],
      [${random_uuid.transform4.result}].[head_sha],
      [${random_uuid.transform4.result}].[path],
      [${random_uuid.transform4.result}].[display_title],
      [${random_uuid.transform4.result}].[run_number],
      [${random_uuid.transform4.result}].[event],
      [${random_uuid.transform4.result}].[status],
      [${random_uuid.transform4.result}].[conclusion],
      [${random_uuid.transform4.result}].[workflow_id],
      [${random_uuid.transform4.result}].[check_suite_id],
      [${random_uuid.transform4.result}].[check_suite_node_id],
      [${random_uuid.transform4.result}].[url],
      [${random_uuid.transform4.result}].[html_url],
      [${random_uuid.transform4.result}].[created_at],
      [${random_uuid.transform4.result}].[updated_at],
      [${random_uuid.transform4.result}].[actor],
      [${random_uuid.transform4.result}].[run_attempt],
      [${random_uuid.transform4.result}].[run_started_at],
      [${random_uuid.transform4.result}].[triggering_actor],
      [${random_uuid.transform4.result}].[jobs_url],
      [${random_uuid.transform4.result}].[logs_url],
      [${random_uuid.transform4.result}].[check_suite_url],
      [${random_uuid.transform4.result}].[artifacts_url],
      [${random_uuid.transform4.result}].[cancel_url],
      [${random_uuid.transform4.result}].[rerun_url],
      [${random_uuid.transform4.result}].[workflow_url],
      [${random_uuid.transform4.result}].[repository],
      [${random_uuid.transform4.result}].[head_repository],
      [${random_uuid.transform4.result}].[EventProcessedUtcTime],
      [${random_uuid.transform4.result}].[PartitionId],
      [${random_uuid.transform4.result}].[EventEnqueuedUtcTime],
      [${random_uuid.transform4.result}].[jobSteps]
  FROM [${random_uuid.transform4.result}]
  CROSS APPLY GetArrayElements([${random_uuid.transform4.result}].[jobSteps]) AS [${random_uuid.transform5.result}]
  ),

  [${random_uuid.transform6.result}] AS (
  SELECT
      [${random_uuid.transform3.result}].[previous_attempt_url] AS [previous_attempt_url],
      [${random_uuid.transform3.result}].[head_commit] AS [head_commit],
      [${random_uuid.transform3.result}].[pull_requests] AS [pull_requests],
      [${random_uuid.transform3.result}].[referenced_workflows] AS [referenced_workflows],
      [${random_uuid.transform3.result}].[id] AS [id],
      [${random_uuid.transform3.result}].[name] AS [name],
      [${random_uuid.transform3.result}].[node_id] AS [node_id],
      [${random_uuid.transform3.result}].[head_branch] AS [head_branch],
      [${random_uuid.transform3.result}].[head_sha] AS [head_sha],
      [${random_uuid.transform3.result}].[path] AS [path],
      [${random_uuid.transform3.result}].[display_title] AS [display_title],
      [${random_uuid.transform3.result}].[run_number] AS [run_number],
      [${random_uuid.transform3.result}].[event] AS [event],
      [${random_uuid.transform3.result}].[status] AS [status],
      [${random_uuid.transform3.result}].[conclusion] AS [conclusion],
      [${random_uuid.transform3.result}].[workflow_id] AS [workflow_id],
      [${random_uuid.transform3.result}].[check_suite_id] AS [check_suite_id],
      [${random_uuid.transform3.result}].[check_suite_node_id] AS [check_suite_node_id],
      [${random_uuid.transform3.result}].[url] AS [url],
      [${random_uuid.transform3.result}].[html_url] AS [html_url],
      [${random_uuid.transform3.result}].[created_at] AS [created_at],
      [${random_uuid.transform3.result}].[updated_at] AS [updated_at],
      [${random_uuid.transform3.result}].[actor] AS [actor],
      [${random_uuid.transform3.result}].[run_attempt] AS [run_attempt],
      [${random_uuid.transform3.result}].[run_started_at] AS [run_started_at],
      [${random_uuid.transform3.result}].[triggering_actor] AS [triggering_actor],
      [${random_uuid.transform3.result}].[jobs_url] AS [jobs_url],
      [${random_uuid.transform3.result}].[logs_url] AS [logs_url],
      [${random_uuid.transform3.result}].[check_suite_url] AS [check_suite_url],
      [${random_uuid.transform3.result}].[artifacts_url] AS [artifacts_url],
      [${random_uuid.transform3.result}].[cancel_url] AS [cancel_url],
      [${random_uuid.transform3.result}].[rerun_url] AS [rerun_url],
      [${random_uuid.transform3.result}].[workflow_url] AS [workflow_url],
      [${random_uuid.transform3.result}].[repository] AS [repository],
      [${random_uuid.transform3.result}].[head_repository] AS [head_repository],
      [${random_uuid.transform3.result}].[EventProcessedUtcTime] AS [EventProcessedUtcTime],
      [${random_uuid.transform3.result}].[PartitionId] AS [PartitionId],
      [${random_uuid.transform3.result}].[EventEnqueuedUtcTime] AS [EventEnqueuedUtcTime],
      CAST([${random_uuid.transform3.result}].[ArrayValue_jobs].[jobName] AS nvarchar(max)) AS [jobName],
      CAST([${random_uuid.transform3.result}].[ArrayValue_jobs].[sequence] AS bigint) AS [jobSequence],
      CAST([${random_uuid.transform3.result}].[ArrayValue_jobs].[labelsRequested] AS nvarchar(max)) AS [jobLabelsRequested],
      CAST([${random_uuid.transform3.result}].[ArrayValue_jobs].[runnerOS] AS nvarchar(max)) AS [runnerOS],
      CAST([${random_uuid.transform3.result}].[ArrayValue_jobs].[runnerImage] AS nvarchar(max)) AS [runnerImage],
      CAST([${random_uuid.transform3.result}].[ArrayValue_jobs].[runnerImageProvisioner] AS nvarchar(max)) AS [runnerImageProvisioner],
      CAST([${random_uuid.transform3.result}].[ArrayValue_jobs].[startedAt] AS datetime) AS [jobStartedAt],
      CAST([${random_uuid.transform3.result}].[ArrayValue_jobs].[completedAt] AS datetime) AS [jobCompletedAt],
      CAST([${random_uuid.transform3.result}].[ArrayValue_jobs].[conclusion] AS nvarchar(max)) AS [jobConclusion],
      CAST([${random_uuid.transform3.result}].[ArrayValue_jobSteps].[stepName] AS nvarchar(max)) AS [stepName],
      CAST([${random_uuid.transform3.result}].[ArrayValue_jobSteps].[sequence] AS bigint) AS [stepSequence],
      CAST([${random_uuid.transform3.result}].[ArrayValue_jobSteps].[action] AS nvarchar(max)) AS [stepAction],
      CAST([${random_uuid.transform3.result}].[ArrayValue_jobSteps].[run] AS nvarchar(max)) AS [stepRun],
      CAST([${random_uuid.transform3.result}].[ArrayValue_jobSteps].[startedAt] AS datetime) AS [stepStartedAt],
      CAST([${random_uuid.transform3.result}].[ArrayValue_jobSteps].[completedAt] AS datetime) AS [stepCompletedAt],
      CAST([${random_uuid.transform3.result}].[ArrayValue_jobSteps].[conclusion] AS nvarchar(max)) AS [stepConclusion]
  FROM [${random_uuid.transform3.result}]
  )

  SELECT
      [${random_uuid.transform6.result}].[previous_attempt_url],
      [${random_uuid.transform6.result}].[head_commit],
      [${random_uuid.transform6.result}].[pull_requests],
      [${random_uuid.transform6.result}].[referenced_workflows],
      [${random_uuid.transform6.result}].[id],
      [${random_uuid.transform6.result}].[name],
      [${random_uuid.transform6.result}].[node_id],
      [${random_uuid.transform6.result}].[head_branch],
      [${random_uuid.transform6.result}].[head_sha],
      [${random_uuid.transform6.result}].[path],
      [${random_uuid.transform6.result}].[display_title],
      [${random_uuid.transform6.result}].[run_number],
      [${random_uuid.transform6.result}].[event],
      [${random_uuid.transform6.result}].[status],
      [${random_uuid.transform6.result}].[conclusion],
      [${random_uuid.transform6.result}].[workflow_id],
      [${random_uuid.transform6.result}].[check_suite_id],
      [${random_uuid.transform6.result}].[check_suite_node_id],
      [${random_uuid.transform6.result}].[url],
      [${random_uuid.transform6.result}].[html_url],
      [${random_uuid.transform6.result}].[created_at],
      [${random_uuid.transform6.result}].[updated_at],
      [${random_uuid.transform6.result}].[actor],
      [${random_uuid.transform6.result}].[run_attempt],
      [${random_uuid.transform6.result}].[run_started_at],
      [${random_uuid.transform6.result}].[triggering_actor],
      [${random_uuid.transform6.result}].[jobs_url],
      [${random_uuid.transform6.result}].[logs_url],
      [${random_uuid.transform6.result}].[check_suite_url],
      [${random_uuid.transform6.result}].[artifacts_url],
      [${random_uuid.transform6.result}].[cancel_url],
      [${random_uuid.transform6.result}].[rerun_url],
      [${random_uuid.transform6.result}].[workflow_url],
      [${random_uuid.transform6.result}].[repository],
      [${random_uuid.transform6.result}].[head_repository],
      [${random_uuid.transform6.result}].[EventProcessedUtcTime],
      [${random_uuid.transform6.result}].[PartitionId],
      [${random_uuid.transform6.result}].[EventEnqueuedUtcTime],
      [${random_uuid.transform6.result}].[jobName],
      [${random_uuid.transform6.result}].[jobSequence],
      [${random_uuid.transform6.result}].[jobLabelsRequested],
      [${random_uuid.transform6.result}].[runnerOS],
      [${random_uuid.transform6.result}].[runnerImage],
      [${random_uuid.transform6.result}].[runnerImageProvisioner],
      [${random_uuid.transform6.result}].[jobStartedAt],
      [${random_uuid.transform6.result}].[jobCompletedAt],
      [${random_uuid.transform6.result}].[jobConclusion],
      [${random_uuid.transform6.result}].[stepName],
      [${random_uuid.transform6.result}].[stepSequence],
      [${random_uuid.transform6.result}].[stepAction],
      [${random_uuid.transform6.result}].[stepRun],
      [${random_uuid.transform6.result}].[stepStartedAt],
      [${random_uuid.transform6.result}].[stepCompletedAt],
      [${random_uuid.transform6.result}].[stepConclusion]
  INTO [${random_uuid.output.result}]
  FROM [${random_uuid.transform6.result}]
  QUERY

  identity {
    type = "SystemAssigned"
  }
}

resource "azurerm_stream_analytics_stream_input_eventhub" "beaver" {
  name                      = "${random_uuid.input.result}-input"
  stream_analytics_job_name = azurerm_stream_analytics_job.beaver.name
  resource_group_name       = azurerm_resource_group.beaver.name
  servicebus_namespace      = azurerm_eventhub_namespace.beaver.name
  eventhub_name             = azurerm_eventhub.beaver.name
  shared_access_policy_key  = azurerm_eventhub_namespace.beaver.default_primary_key
  shared_access_policy_name = "RootManageSharedAccessKey"

  serialization {
    type     = "Json"
    encoding = "UTF8"
  }
}

resource "azurerm_stream_analytics_output_powerbi" "powerbi-stream" {
  name                    = random_uuid.output.result
  stream_analytics_job_id = azurerm_stream_analytics_job.beaver.id
  dataset                 = local.powerbi_config.dataset
  table                   = local.powerbi_config.table
  group_id                = local.powerbi_config.group_id
  group_name              = local.powerbi_config.group_name
}

# Start the Azure Stream Analytics job 
resource "azurerm_stream_analytics_job_schedule" "beaver" {
  stream_analytics_job_id = azurerm_stream_analytics_job.beaver.id
  start_mode              = "JobStartTime"

  depends_on = [
    azurerm_stream_analytics_job.beaver,
    azurerm_stream_analytics_stream_input_eventhub.beaver,
    azurerm_stream_analytics_output_powerbi.powerbi-stream,
  ]
}

# The following variables are expected to be present as environment variables
variable "webhook_secret" {}
variable "private_key" {}
variable "app_id" {}

resource "azurerm_linux_web_app" "beaver-app" {
  name                = "beaver-${local.org}"
  resource_group_name = azurerm_resource_group.beaver.name
  location            = azurerm_service_plan.beaver-asp.location
  service_plan_id     = azurerm_service_plan.beaver-asp.id

  app_settings = {
    "AZURE_EVENT_HUB_CONNECTION_STRING" = azurerm_eventhub_namespace.beaver.default_primary_connection_string
    "AZURE_EVENT_HUB_NAME"              = azurerm_eventhub.beaver.name
    "WEBHOOK_SECRET"                    = var.webhook_secret
    "APP_ID"                            = var.app_id
    "PRIVATE_KEY"                       = var.private_key
  }

  site_config {
    application_stack {
      docker_image     = local.docker_config.image
      docker_image_tag = local.docker_config.tag
    }
  }
}
