#!/bin/bash

set -e

basedir=/Users/mtm/pdev/taylormonacelli/seniorsite
name=NetworkStack

tpl1=$basedir/cdk.out/$name.template.json
tpl2=$basedir/cdk.out/${name}-modified.template.json
s3tpl=s3://streambox-cdi/latest/aws/$(basename $tpl2)
s3tplendpoint=https://streambox-cdi.s3-us-west-2.amazonaws.com/latest/aws/$(basename $tpl2)

cd $basedir
rm -rf $basedir/cdk.out
cdk synth >/dev/null
#cat $tpl1 | jq 'del(.Parameters.BootstrapVersion) | del(.Rules.CheckBootstrapVersion) | delpaths([paths | select(.[-1] | strings | startswith("SsmParam"))])' >$tpl2
cat $tpl1 | jq 'del(.Parameters.BootstrapVersion) | del(.Rules.CheckBootstrapVersion)' >$tpl2
PAGER=cat aws cloudformation validate-template --region us-east-1 --template-body file://$tpl2
aws s3 cp $tpl2 $s3tpl --grants read=uri=http://acs.amazonaws.com/groups/global/AllUsers
curl -sI $s3tplendpoint
echo $s3tplendpoint

open 'https://us-east-1.console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks/create/template'

exit 0
time cdk deploy --require-approval=never --no-rollback
