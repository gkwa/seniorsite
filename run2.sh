#!/bin/bash

./addheaderparams.sh

ytt -f cdk.out/NetworkStack.template.yaml -f overlay.yaml | sponge cdk.out/NetworkStack.template.yaml
./yqclean.sh
