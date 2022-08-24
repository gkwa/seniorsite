#!/bin/bash

set -e

yq --inplace '
    del(.. | select(tag == "!!map" and length == 0)) |
    del(.Rules) |
    del(.[].[].Metadata) |
    del(.Conditions.CDKMetadataAvailable) |
    del(.. | select(has("CDKMetadata")).CDKMetadata) |
    del(.. | select(has("BootstrapVersion")).BootstrapVersion) |
    del(.[].vpcsbxcdivpcFEE27BEE) |
    del(.[].subnetscdiAsubnetF37012F5) |
    del(.[].subnetscdiBsubnet1A3B9F51) |
    del(.[].IGWigwsbxcdi7C0EA41C) |
    del(.[].IGWvpcgwsbxcdiDF298982) |
    del(.[].rtablescdiArtableA59AF960) |
    del(.[].rtablescdiBsrta63414513) |
    del(.[].rtablescdiArouteEE2A88FE) |
    del(.[].rtablescdiAsrtaA81E8116)
' cdk.out/NetworkStack.template.yaml
