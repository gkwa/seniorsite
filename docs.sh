#!/bin/bash

set -e

basedir=/Users/mtm/pdev/taylormonacelli/seniorsite
name=NetworkStack

diagram=$basedir/assets/cdi-network.png
s3diagram=s3://streambox-cdi/latest/aws/network.png
s3diagramenpoint=https://streambox-cdi.s3-us-west-2.amazonaws.com/latest/aws/network.png

aws s3 cp $diagram $s3diagram --grants read=uri=http://acs.amazonaws.com/groups/global/AllUsers
curl -sI $s3diagramenpoint
echo $s3diagramenpoint
