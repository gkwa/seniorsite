#!/bin/bash

set -e

ytt -f cdk.out/NetworkStack.template.yaml -f overlay.yaml | sponge cdk.out/NetworkStack.template.yaml

yq --inplace '
   del(.. | select(tag == "!!map" and length == 0)) |
   del(.[].[].Metadata)
' cdk.out/NetworkStack.template.yaml

# merges f2.yml into f1.yml (inplace)
yq eval-all --inplace 'select(fileIndex == 1) * select(fileIndex == 0)' cdk.out/NetworkStack.template.yaml headerparams.yaml
