#!/bin/bash

set -e

cdk synth
yq eval --output-format=yaml --prettyPrint cdk.out/NetworkStack.template.json >cdk.out/NetworkStack.template.yaml
