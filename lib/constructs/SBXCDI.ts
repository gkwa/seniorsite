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
                'af-south-1': { ami: 'ami-029ea7c67eb175492' },
                'ap-east-1': { ami: 'ami-0db45bfafd387f211' },
                'ap-northeast-1': { ami: 'ami-095479d0f5fd754b2' },
                'ap-northeast-2': { ami: 'ami-03dac10390e25bfed' },
                'ap-northeast-3': { ami: 'ami-05cd00e8e31056536' },
                'ap-south-1': { ami: 'ami-0addce7703ae20ea5' },
                'ap-southeast-1': { ami: 'ami-05ead723d32dac9db' },
                'ap-southeast-2': { ami: 'ami-00514ba46a0948a45' },
                'ap-southeast-3': { ami: 'ami-0fe35f4d5f343ecf1' },
                'ca-central-1': { ami: 'ami-072175f109d9408b1' },
                'eu-central-1': { ami: 'ami-003197dae1192087f' },
                'eu-north-1': { ami: 'ami-083823e5aa2833121' },
                'eu-south-1': { ami: 'ami-00593819934617284' },
                'eu-west-1': { ami: 'ami-0980abe0977dbd00d' },
                'eu-west-2': { ami: 'ami-0ee916316055089a5' },
                'eu-west-3': { ami: 'ami-0f66d5634e8afdca8' },
                'me-south-1': { ami: 'ami-003fb8fbf67a0dcc4' },
                'sa-east-1': { ami: 'ami-0eb79362cb8f59789' },
                'us-east-1': { ami: 'ami-0233508e64363ee5a' },
                'us-east-2': { ami: 'ami-0d47d5e3f4f198110' },
                'us-west-1': { ami: 'ami-0839ab0bb206d9f9b' },
                'us-west-2': { ami: 'ami-0d01bfeb56fa54146' },
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
