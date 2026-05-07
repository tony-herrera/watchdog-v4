terraform {
  backend "s3" {
    bucket         = "watchdog-v4-terraform-state-446483465327"
    key            = "state/terraform.tfstate"
    region         = "us-west-2"
    encrypt        = true
  }
}