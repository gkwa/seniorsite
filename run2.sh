#!/bin/bash

cdk synth
yq e -P cdk.out/NetworkStack.template.json >cdk.out/NetworkStack.template.yaml

yq --inplace '
    del(.. | select(tag == "!!map" and length == 0)) |
    del(.Rules) |
    del(.Conditions.CDKMetadataAvailable) |
    del(.. | select(has("CDKMetadata")).CDKMetadata) |
    del(.. | select(has("Metadata")).Metadata) |
    del(.. | select(has("BootstrapVersion")).BootstrapVersion)
' cdk.out/NetworkStack.template.yaml

git diff --color $path
