#!/bin/bash

yq --inplace '
    del(.. | select(has("Metadata")).Metadata)
' cdk.out/NetworkStack.template.yaml
