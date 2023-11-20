sudo docker build -t lgarriga/rust-quest-runner . --no-cache

case $1 in 
    run)
        sudo docker run -p 3030:3030 -e "AUTH=potato" --cpus="2" lgarriga/rust-quest-runner;;
    push)
        sudo docker push lgarriga/rust-quest-runner:latest;;
    *)
        echo "Usage: ./run_docker.sh [run|push]";;
esac