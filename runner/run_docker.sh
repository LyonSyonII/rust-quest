sudo docker build -t lgarriga/rust-quest-runner .
sudo docker run -p 3020:3031 -e "PASSWORD=potato" -e "PORT=3031" lgarriga/rust-quest-runner