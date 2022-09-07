import { Construct } from 'constructs';
import { CfnLaunchTemplate, CfnSecurityGroup, CfnVPC } from 'aws-cdk-lib/aws-ec2';
import { Aws, CfnMapping, aws_ec2 as ec2, Fn } from 'aws-cdk-lib';
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

        const regionMap = new CfnMapping(this, 'RegionMap', {
            mapping: {
                'us-west-2': { ami: 'ami-0abe47d4ac777a495' },
                'us-west-1': { ami: 'ami-0bd3a6a1f39653aab' },
                'us-east-2': { ami: 'ami-0cb2d696c30f18604' },
                'us-east-1': { ami: 'ami-0712ab24b96305487' },
                'sa-east-1': { ami: 'ami-0b83cbcce2add29a8' },
                'me-south-1': { ami: 'ami-0c857642d2c102ad6' },
                'eu-west-3': { ami: 'ami-02a9a46bc74fdd9a5' },
                'eu-west-2': { ami: 'ami-06dcd7f73784e2e3e' },
                'eu-west-1': { ami: 'ami-0a9a98eb7721e7d58' },
                'eu-south-1': { ami: 'ami-032261404e6ad1f98' },
                'eu-north-1': { ami: 'ami-0ce28a3a182f1fd71' },
                'eu-central-1': { ami: 'ami-0356d15b6fca5874d' },
                'ca-central-1': { ami: 'ami-022e10a316be4ce7f' },
                'ap-southeast-3': { ami: 'ami-0136ac34ac1de7d76' },
                'ap-southeast-2': { ami: 'ami-067cc004686346ca3' },
                'ap-southeast-1': { ami: 'ami-0b87a084c7e2420f9' },
                'ap-south-1': { ami: 'ami-06ef3f23bfcb008b5' },
                'ap-northeast-3': { ami: 'ami-0b8fe6336e7d34097' },
                'ap-northeast-2': { ami: 'ami-0d4688bbacd247638' },
                'ap-northeast-1': { ami: 'ami-0330cd800562940c5' },
                'ap-east-1': { ami: 'ami-0f0055a3652ced203' },
                'af-south-1': { ami: 'ami-0a0095a525e74834c' },
            },
        });

        // Role for EC2 Instance Profile
        const role = new Role(this, 'cdi-role', {
            assumedBy: new ServicePrincipal('ec2.amazonaws.com'),
            description: 'Role for sbx CDI instances',
            roleName: `sbx-cdi-${cdk.Stack.of(this).region}`,
        });

        role.addToPolicy(
            new PolicyStatement({
                actions: ['mediaconnect:*'],
                resources: ['*'],
            }),
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
            imageId: regionMap.findInMap(Aws.REGION, 'ami'),
            instanceType: props.instanceType.toString(),
            iamInstanceProfile: {
                arn: cdiInstanceProfile.attrArn,
            },
            tagSpecifications: [
                {
                    resourceType: 'instance',
                    tags: [
                        {
                            key: 'Name',
                            value: 'sbx-cdi',
                        },
                    ],
                },
            ],
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

        const launchTemplate = new CfnLaunchTemplate(this, 'launch-template', {
            launchTemplateData,
            launchTemplateName: 'sbx-cdi',
        });

        const instance1 = new ec2.CfnInstance(this, 'Instance1', {
            launchTemplate: {
                launchTemplateId: launchTemplate.ref,
                version: launchTemplate.attrLatestVersionNumber,
            },
            availabilityZone: subnets.cdiA.availabilityZone,
        });
        cdk.Tags.of(instance1).add('Name', 'sbx-cdi');

        new cdk.CfnOutput(this, 'publicIp', {
            value: instance1.attrPublicIp,
            description: 'Instance Public Ip',
            exportName: 'ec2-public-ip',
        });
    }
}
