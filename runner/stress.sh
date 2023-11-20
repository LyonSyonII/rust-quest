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

time request localhost:3030 500