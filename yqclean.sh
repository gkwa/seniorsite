#!/bin/bash

set -e

yq --inplace '
    del(.. | select(tag == "!!map" and length == 0)) |
    del(.[].[].Metadata) |
    del(.. | select(has("CDKMetadata")).CDKMetadata) |
    del(.. | select(has("BootstrapVersion")).BootstrapVersion)
' cdk.out/NetworkStack.template.yaml
