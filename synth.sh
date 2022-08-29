#!/bin/bash

set -e

cdk synth >cdk.out/NetworkStack.template.yaml
yq e -P cdk.out/NetworkStack.template.json >cdk.out/NetworkStack.template.yaml
