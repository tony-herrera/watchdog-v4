# Output the URL of our Load Balancer so we can test it in the browser
output "alb_dns_name" {
  value       = aws_lb.main.dns_name
  description = "The public URL of the Watchdog Application"
}