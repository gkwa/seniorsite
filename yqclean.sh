#!/bin/bash

set -e

yq --inplace '
   del(.. | select(tag == "!!map" and length == 0)) |
   del(.[].[].Metadata)
' cdk.out/NetworkStack.template.yaml
