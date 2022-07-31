import { Construct } from 'constructs';
import { CfnLaunchTemplate, CfnSecurityGroup, CfnVPC } from 'aws-cdk-lib/aws-ec2';
import { aws_ec2 as ec2, Fn } from 'aws-cdk-lib';
import { CfnInstanceProfile, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import * as cdk from 'aws-cdk-lib';
import { Subnet } from './Subnet';

interface SBXCDIProps {
    cdisg: CfnSecurityGroup;
    instanceType: ec2.InstanceType;
    keyName: String;
    subnets: Subnet;
    vpc: CfnVPC;
}

export class SBXCDI extends Construct {
    constructor(scope: Construct, id: string, props: SBXCDIProps) {
        super(scope, id);

        const { subnets, cdisg } = props;

        const ami = new ec2.AmazonLinuxImage({
            generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
            kernel: ec2.AmazonLinuxKernel.KERNEL5_X
        });

        // Role for EC2 Instance Profile
        const role = new Role(this, 'cdi-role', {
            assumedBy: new ServicePrincipal('ec2.amazonaws.com'),
            description: 'Role for sbx CDI instances',
            roleName: `sbx-cdi-role-${cdk.Stack.of(this).region}`,
        });

        role.addToPolicy(
            new PolicyStatement({
                actions: ['mediaconnect:*'],
                resources: ['*'],
            })
        );

        const cdiInstanceProfile = new CfnInstanceProfile(this, 'cdiInstanceProfile', {
            roles: [role.roleName],
            instanceProfileName: `cdiInstanceProfile-${cdk.Stack.of(this).region}`,
        });

        // User Data script install streambox encoder/iris
        const userData = Fn.base64(`#!/usr/bin/env bash
/opt/sbx/InstallSbxCDI/sanity_check
PATH=/opt/amazon/efa/bin:$PATH /opt/sbx/InstallSbxCDI/aws-efa-installer/efa_test.sh
`);

        // Launch Template
        const launchTemplateData: CfnLaunchTemplate.LaunchTemplateDataProperty = {
            imageId: ami.getImage(this).imageId,
            instanceType: props.instanceType.toString(),
            iamInstanceProfile: {
                arn: cdiInstanceProfile.attrArn,
            },
            networkInterfaces: [
                {
                    interfaceType: 'efa',
                    associatePublicIpAddress: true,
                    deviceIndex: 0,
                    groups: [cdisg.attrGroupId],
                    subnetId: subnets.cdiA.attrSubnetId,
                },
            ],
            keyName: props.keyName.toString(),
            userData,
        };

        new CfnLaunchTemplate(this, 'launch-template', {
            launchTemplateData,
            launchTemplateName: 'sbx-cdi',
        });
    }
}
