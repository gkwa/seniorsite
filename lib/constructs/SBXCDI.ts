import { Construct } from 'constructs';
import { CfnLaunchTemplate, CfnSecurityGroup, CfnVPC, Instance, InstanceType } from 'aws-cdk-lib/aws-ec2';
import { Fn } from 'aws-cdk-lib';
import { Subnet } from './Subnet';
import { CfnInstanceProfile, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { aws_ec2 as ec2 } from 'aws-cdk-lib';
import * as cdk from 'aws-cdk-lib';

interface SBXCDIProps {
    websg: CfnSecurityGroup,
    instanceType: ec2.InstanceType,
    keyName: String,
    subnets: Subnet,
    vpc: CfnVPC,
}

export class SBXCDI extends Construct {
    constructor(scope: Construct, id: string, props: SBXCDIProps) {
        super(scope, id)

        const { subnets, websg } = props

        const ami = new ec2.AmazonLinuxImage({
            generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
        })

        // Role for EC2 Instance Profile
        const role = new Role(this, 'webRole', {
            assumedBy: new ServicePrincipal('ec2.amazonaws.com'),
            description: 'Role for CDI instances',
        });

        role.addToPolicy(new PolicyStatement({
            actions: ['mediaconnect:*'],
            resources: ['*']
        }))

        const webInstanceProfile = new CfnInstanceProfile(this, 'webInstanceProfile', {
            roles: [role.roleName],
            instanceProfileName: 'webInstanceProfile',
        });

        // User Data script install streambox encoder/iris
        const userData = Fn.base64(`#!/usr/bin/env bash
set -x
set -e
mkdir -p /opt/sbx
curl -o /opt/sbx/InstallSbxCDI.tgz https://streambox-cdi.s3-us-west-2.amazonaws.com/latest/linux/InstallSbxCDI.tgz
tar xzf /opt/sbx/InstallSbxCDI.tgz -C /opt/sbx
cd /opt/sbx/InstallSbxCDI
/opt/sbx/InstallSbxCDI/installweb
/opt/sbx/InstallSbxCDI/installefa
/opt/sbx/InstallSbxCDI/installsbx
/opt/sbx/InstallSbxCDI/sanity_check
PATH=/opt/amazon/efa/bin:$PATH /opt/sbx/InstallSbxCDI/aws-efa-installer/efa_test.sh
`)

        // Launch Template
        const launchTemplateData: CfnLaunchTemplate.LaunchTemplateDataProperty = {
            imageId: ami.getImage(this).imageId,
            instanceType: props.instanceType.toString(),
            iamInstanceProfile: {
                arn: webInstanceProfile.attrArn
            },
            networkInterfaces: [{
                interfaceType: 'efa',
                associatePublicIpAddress: true,
                deviceIndex: 0,
                groups: [websg.attrGroupId],
                subnetId: subnets.cdiA.attrSubnetId,

            }],
            keyName: props.keyName.toString(),
            userData
        }

        const launchTemplate = new CfnLaunchTemplate(this, 'launch-template', {
            launchTemplateData,
            launchTemplateName: 'sbx-cdi'
        })

        const instance1 = new ec2.CfnInstance(this, 'Instance1', {
            launchTemplate: {
                launchTemplateId: launchTemplate.ref,
                version: launchTemplate.attrLatestVersionNumber,
            },
            availabilityZone: subnets.cdiA.availabilityZone
        })
        cdk.Tags.of(instance1).add('Name', 'sbx-cdi');

        new cdk.CfnOutput(this, 'publicIp', {
            value: instance1.attrPublicIp,
            description: 'Instance Public Ip',
            exportName: 'ec2-public-ip',
        });
    }
}