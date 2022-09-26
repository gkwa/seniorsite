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
                'us-west-2': {'ami': 'ami-0d1435fca6d5bfcb2'},
                'us-west-1': {'ami': 'ami-0ce1f16458c55e4af'},
                'us-east-2': {'ami': 'ami-0580ca52b3078b713'},
                'us-east-1': {'ami': 'ami-087fc8372157d3dcd'},
                'sa-east-1': {'ami': 'ami-0b1529639c35af877'},
                'me-south-1': {'ami': 'ami-018fc14d9234d20df'},
                'eu-west-3': {'ami': 'ami-077526f7b35e4b672'},
                'eu-west-2': {'ami': 'ami-0568a84f1458f2f28'},
                'eu-west-1': {'ami': 'ami-056418d671b842b23'},
                'eu-south-1': {'ami': 'ami-091ce22cb8d342a8d'},
                'eu-north-1': {'ami': 'ami-071cf944c2ec8bb07'},
                'eu-central-1': {'ami': 'ami-028a753b13020b2c7'},
                'ca-central-1': {'ami': 'ami-002f1b81766507eef'},
                'ap-southeast-3': {'ami': 'ami-07f52057910279baf'},
                'ap-southeast-2': {'ami': 'ami-065980fa871407cf5'},
                'ap-southeast-1': {'ami': 'ami-06234a3460c389930'},
                'ap-south-1': {'ami': 'ami-085a3e2f85771757d'},
                'ap-northeast-3': {'ami': 'ami-0d378487e93518392'},
                'ap-northeast-2': {'ami': 'ami-0534f161f1dcf207c'},
                'ap-northeast-1': {'ami': 'ami-093f5560f5944f175'},
                'ap-east-1': {'ami': 'ami-0abf403919e23c298'},
                'af-south-1': {'ami': 'ami-0ea2f25d95df9957b'},
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
# update administrator password to ec2 instance-id
php /opt/sbx/update_pass_accounts.php --xml=/var/www/html/data/accounts.xml

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
