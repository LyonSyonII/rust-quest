function request() {
    for ((i = 1; i <= $2; i++))
    do
        curl -i --request POST \
                --url $1/evaluate.json \
                --header 'Content-Type: application/json' \
                --header 'authorization: macarena' \
                --data "{
                    \"code\": \"fn main() { println!(\\\"Hello, $i!\\\") } \"
                }" &
    done
    wait
}

USAGE="Usage: ./stress.sh [url] [requests]"

if [ -z $2 ]; then
    echo $USAGE
    exit 1
fi

time request $1 $2