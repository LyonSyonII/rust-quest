sudo docker build -t lgarriga/rust-quest-runner .

if [[ $1 == "run" ]]; then
    sudo docker run -p 3020:3031 -e "PASSWORD=potato" -e "PORT=3031" lgarriga/rust-quest-runner
elif [[ $1 == "push" ]]; then
    sudo docker push lgarriga/rust-quest-runner:latest
else
    echo "Usage: ./run_docker.sh [run|push]"
fi