#!/bin/bash

./yqclean.sh
./addheaderparams.sh

ytt -f cdk.out/NetworkStack.template.yaml -f overlay.yaml |
    sponge cdk.out/NetworkStack.template.yaml

git diff --color
