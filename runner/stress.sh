function request() {
    for ((i = 1; i <= $2; i++))
    do
        curl -i --request POST \
                --url http://$1/evaluate.json \
                --header 'Content-Type: application/json' \
                --header 'authorization: potato' \
                --data "{
                    \"code\": \"fn main() { println!(\\\"Hello, $i!\\\") } \"
                }" &
    done
    wait
}

USAGE="Usage: ./stress.sh [local|server] [requests]"

if [ -z $2 ]; then
    echo $USAGE
    exit 1
fi

case $1 in
    "local"*) time request localhost:3030 $2;;
    "server") time request 0.0.0.0:3030 $2;;
    *) echo $USAGE;;
esac