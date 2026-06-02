terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0" # 2026-standard version
    }
  }
}

provider "aws" {
  region = "us-west-2" # Temecula area is closest to Oregon (us-west-2)
}