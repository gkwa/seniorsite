#!/bin/bash

yq --inplace '
    del(.[].[].Metadata)
' cdk.out/NetworkStack.template.yaml
