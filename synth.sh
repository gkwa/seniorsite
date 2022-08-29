#!/bin/bash

set -e

cdk synth
yq e -P cdk.out/NetworkStack.template.json >cdk.out/NetworkStack.template.yaml
