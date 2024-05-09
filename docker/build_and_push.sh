IMAGE_NAME=magland/stan-wasm-server

docker build -t $IMAGE_NAME .

# prompt user to continue
echo "Press any key to continue to push to docker hub..."
read -n 1 -s

docker push $IMAGE_NAME