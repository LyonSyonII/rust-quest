docker build -t lgarriga/rust-quest-runner .

case $1 in 
    run)
        docker run -p 3030:3030 --cpus="2" lgarriga/rust-quest-runner;;
    push)
        docker push lgarriga/rust-quest-runner:latest;;
    *)
        echo "Usage: ./run_docker.sh [run|push]";;
esac