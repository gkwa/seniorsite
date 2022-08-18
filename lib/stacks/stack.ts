import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { VPC } from '../constructs/Vpc';
import { Subnet } from '../constructs/Subnet';
import { SecurityGroup } from '../constructs/SecurityGroup';
import { IGW } from '../constructs/Igw';
import { RTable } from '../constructs/RTable';
import { SBXCDI } from '../constructs/SBXCDI';
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

export class NetworkStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        const SSHLocation = new cdk.CfnParameter(this, 'SSHLocation', {
            type: 'String',
            allowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5]).){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(/([0-9]|[1-2][0-9]|3[0-2]))$',
            description: 'SSH: Please set CIDR to x.x.x.x/32 to allow one specific IP address access, 0.0.0.0/0 to allow all IP addresses access, or another CIDR range.',
            constraintDescription: 'must be a valid IP CIDR range of the form x.x.x.x/x',
            minLength: 9,
            maxLength: 18,
        });

        const keyName = new cdk.CfnParameter(this, 'KeyName', {
            type: 'AWS::EC2::KeyPair::KeyName',
            allowedPattern: '.+',
            description: 'Name of an existing EC2 key pair to enable SSH access to the instance',
            constraintDescription: 'must be the name of an existing EC2 KeyPair',
        });

        const instanceTypeParam = new cdk.CfnParameter(this, 'InstanceType', {
            type: 'String',
            description: 'EC2 instance type',
            default: 'c5n.9xlarge',
        });

        const instanceType = new ec2.InstanceType(instanceTypeParam.valueAsString);

        const { vpc } = new VPC(this, 'vpc-sbx-cdi');

        const subnets = new Subnet(this, 'subnets', { vpc });

        const securityGroups = new SecurityGroup(this, 'SGs', {
            vpc,
            SSHLocation: SSHLocation.valueAsString,
        });

        const igw = new IGW(this, 'IGW', { vpc });

        new RTable(this, 'rtables', { vpc, subnets, igw });

        const cdi = new SBXCDI(this, 'CDI', {
            cdisg: securityGroups.cdi,
            instanceType: instanceType,
            keyName: keyName.valueAsString,
            subnets,
            vpc,
        });
    }
}
