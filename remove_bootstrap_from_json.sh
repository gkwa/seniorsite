#!/bin/bash

set -e

basedir=/Users/mtm/pdev/taylormonacelli/seniorsite
name=NetworkStack

tpl1=$basedir/cdk.out/$name.template.json
tpl2=$basedir/cdk.out/${name}-modified.template.json

cd $basedir
rm -rf $basedir/cdk.out
cdk synth >/dev/null
#cat $tpl1 | jq 'del(.Parameters.BootstrapVersion) | del(.Rules.CheckBootstrapVersion) | delpaths([paths | select(.[-1] | strings | startswith("SsmParam"))])' >$tpl2
cat $tpl1 | jq 'del(.Parameters.BootstrapVersion) | del(.Rules.CheckBootstrapVersion)' >$tpl2
PAGER=cat aws cloudformation validate-template --region us-east-1 --template-body file://$tpl2
