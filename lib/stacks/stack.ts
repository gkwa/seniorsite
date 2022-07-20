import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { VPC } from '../constructs/Vpc'
import { Subnet } from '../constructs/Subnet'
import { SecurityGroup } from '../constructs/SecurityGroup';
import { IGW } from '../constructs/Igw';
import { RTable } from '../constructs/RTable';
import { SBXCDI } from '../constructs/SBXCDI';
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

export class NetworkStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const keyName = new cdk.CfnParameter(this, 'KeyName', {
      type: 'AWS::EC2::KeyPair::KeyName',
      allowedPattern: '.+',
      description: 'Name of an existing EC2 key pair to enable SSH access to the instances',
    });

    const instanceTypeParam = new cdk.CfnParameter(this, 'InstanceType', {
      type: 'String',
      description: 'EC2 instance type',
      default: 'c5n.9xlarge',
      // allowedValues: ['c5n.9xlarge', 'c5n.18xlarge', 'c5n.metal', 'c6a.32xlarge', 'c6a.48xlarge', 'c6a.metal', 'c6gn.16xlarge', 'c6i.32xlarge', 'c6i.metal', 'c6id.32xlarge', 'c6id.metal', 'c7g.16xlarge', 'g4dn.12xlarge', 'g4dn.8xlarge', 'g4dn.metal', 'hpc6a.48xlarge', 'i3en.12xlarge', 'i3en.24xlarge', 'i3en.metal', 'i4i.32xlarge', 'i4i.metal', 'im4gn.16xlarge', 'inf1.24xlarge', 'm5dn.24xlarge', 'm5dn.metal', 'm5n.24xlarge', 'm5n.metal', 'm5zn.12xlarge', 'm5zn.metal', 'm6a.32xlarge', 'm6a.48xlarge', 'm6a.metal', 'm6i.32xlarge', 'm6i.metal', 'm6id.32xlarge', 'm6id.metal', 'p4d.24xlarge', 'r5dn.24xlarge', 'r5dn.metal', 'r5n.24xlarge', 'r5n.metal', 'r6i.32xlarge', 'r6i.metal', 'r6id.32xlarge', 'r6id.metal', 'x2idn.32xlarge', 'x2idn.metal', 'x2iedn.32xlarge', 'x2iedn.metal'],
    });

    console.log('region: ', cdk.Stack.of(this).region)
    console.log('availability zones: ', cdk.Stack.of(this).availabilityZones);

    const instanceType = new ec2.InstanceType(instanceTypeParam.valueAsString)

    const { vpc } = new VPC(this, 'vpc-sbx-cdi')

    const subnets = new Subnet(this, 'subnets', { vpc })

    const securityGroups = new SecurityGroup(this, 'SGs', { vpc })

    const igw = new IGW(this, 'IGW', { vpc })

    new RTable(this, 'rtables', { vpc, subnets, igw })

    const cdi = new SBXCDI(this, 'CDI', {
      websg: securityGroups.web,
      instanceType: instanceType,
      keyName: keyName.valueAsString,
      subnets, vpc
    })
  }
}
