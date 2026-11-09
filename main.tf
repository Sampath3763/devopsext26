resource "random_string" "text" {
  length  = 12
  special = false
  upper   = false
}

resource "local_file" "output" {
  filename = "random.txt"
  content  = "Random text: ${random_string.text.result}"
}