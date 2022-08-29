#!/bin/bash

set -e
set -x

git co -- cdk.out/NetworkStack.template.yaml
./synth.sh
./yqclean.sh
./addheaderparams.sh

ytt -f cdk.out/NetworkStack.template.yaml \
    -f overlays/over1.yaml \
    -f overlays/over2b.yaml \
    -f overlays/over2.yaml \
    -f overlays/over3.yaml \
    -f overlays/over3b.yaml |
    sponge cdk.out/NetworkStack.template.yaml

git diff --color
