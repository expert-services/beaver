variable "powerbi-config" {
  type = object({
    dataset    = string
    table      = string
    group-name = string
  })
  default = {
    dataset    = "actions-workflow-data"
    table      = "data"
    group-name = "beaver-logs"
  }
}

variable "docker-config" {
  type = object({
    image = string
    tag   = string
  })
  default = {
    image = "yjactionsmetrics.azurecr.io/beaver"
    tag   = "latest"
  }
}

variable "resource-group" {
  type = object({
    name     = string
    location = string
  })
  default = {
    name     = "beaver"
    location = "eastus"
  }
}

variable "app-service-plan" {
  type = object({
    name     = string
    os-type  = string
    sku-name = string
  })
  default = {
    name     = "beaver-appserviceplan"
    os-type  = "Linux"
    sku-name = "P1v3"
  }
}

variable "eventhub-namespace" {
  type = object({
    name     = string
    sku      = string
    capacity = number
  })
  default = {
    name     = "beaver-eventhub-ns"
    sku      = "Standard"
    capacity = 1
  }
}

variable "eventhub" {
  type = object({
    name              = string
    partition-count   = number
    message-retention = number
  })
  default = {
    name              = "beaver-eventhub"
    partition-count   = 2
    message-retention = 1
  }
}

variable "consumer-group-name" {
  type    = string
  default = "beaver-consumergroup"
}

variable "stream-analytics-job" {
  type = object({
    name            = string
    streaming-units = number
  })
  default = {
    name            = "beaver-sa-job"
    streaming-units = 3
  }
}

variable "linux-web-app-name" {
  type    = string
  default = "beaver"
}
