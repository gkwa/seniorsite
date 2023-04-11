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
                'us-west-2': { ami: 'ami-084e25a00d365b4c7' },
                'us-west-1': { ami: 'ami-084e25a00d365b4c7' },
                'us-east-2': { ami: 'ami-084e25a00d365b4c7' },
                'us-east-1': { ami: 'ami-084e25a00d365b4c7' },
                'sa-east-1': { ami: 'ami-084e25a00d365b4c7' },
                'me-south-1': { ami: 'ami-084e25a00d365b4c7' },
                'eu-west-3': { ami: 'ami-084e25a00d365b4c7' },
                'eu-west-2': { ami: 'ami-084e25a00d365b4c7' },
                'eu-west-1': { ami: 'ami-084e25a00d365b4c7' },
                'eu-south-1': { ami: 'ami-084e25a00d365b4c7' },
                'eu-north-1': { ami: 'ami-084e25a00d365b4c7' },
                'eu-central-1': { ami: 'ami-084e25a00d365b4c7' },
                'ca-central-1': { ami: 'ami-084e25a00d365b4c7' },
                'ap-southeast-3': { ami: 'ami-084e25a00d365b4c7' },
                'ap-southeast-2': { ami: 'ami-084e25a00d365b4c7' },
                'ap-southeast-1': { ami: 'ami-084e25a00d365b4c7' },
                'ap-south-1': { ami: 'ami-084e25a00d365b4c7' },
                'ap-northeast-3': { ami: 'ami-084e25a00d365b4c7' },
                'ap-northeast-2': { ami: 'ami-084e25a00d365b4c7' },
                'ap-northeast-1': { ami: 'ami-084e25a00d365b4c7' },
                'ap-east-1': { ami: 'ami-084e25a00d365b4c7' },
                'af-south-1': { ami: 'ami-084e25a00d365b4c7' }
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
