#!/bin/bash
FILES=$(curl -L -s https://api.github.com/repos/openscad/openscad-wasm/releases/latest | jq ".assets[].browser_download_url" -r)
for FILE in $FILES
do
    wget $FILE
done
