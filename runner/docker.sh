sudo docker build -t lgarriga/rust-quest-runner .

case $1 in 
    run)
        sudo docker run -p 3020:3031 -e "PASSWORD=potato" -e "PORT=3031" lgarriga/rust-quest-runner
        ;;
    push)
        sudo docker push lgarriga/rust-quest-runner:latest
        ;;
    *)
        echo "Usage: ./run_docker.sh [run|push]"
        ;;
esac