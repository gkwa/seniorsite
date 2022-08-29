#!/bin/bash

set -e

# merges f2.yml into f1.yml (inplace)
yq eval-all --inplace 'select(fileIndex == 1) * select(fileIndex == 0)' cdk.out/NetworkStack.template.yaml cdk.out/headerparams.yaml
