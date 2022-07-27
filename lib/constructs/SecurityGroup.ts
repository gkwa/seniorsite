import { CfnSecurityGroup, CfnVPC, Vpc } from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import { aws_ec2 as ec2 } from 'aws-cdk-lib';

interface SGProps {
    vpc: CfnVPC;
}

export class SecurityGroup extends Construct {
    public readonly cdi: CfnSecurityGroup;

    constructor(scope: Construct, id: string, props: SGProps) {
        super(scope, id);
        const vpcId = props.vpc.ref;

        const cfnSecurityGroup = new ec2.CfnSecurityGroup(this, 'MyCfnSecurityGroup', {
            groupDescription: 'sbx-cdi',
            groupName: 'sbx-cdi',
            tags: [{ key: 'Name', value: 'sbx-cdi' }],
            vpcId,
        });

        new ec2.CfnSecurityGroupIngress(this, 'ACTL3 UDP', {
            groupId: cfnSecurityGroup.attrGroupId,
            description: 'Allow ACT-L3 inbound',
            ipProtocol: 'udp',
            cidrIp: '0.0.0.0/0',
            fromPort: 1770,
            toPort: 1790,
        });

        new ec2.CfnSecurityGroupIngress(this, 'ACTL3 TCP', {
            groupId: cfnSecurityGroup.attrGroupId,
            description: 'Allow ACT-L3 inbound',
            ipProtocol: 'tcp',
            cidrIp: '0.0.0.0/0',
            fromPort: 1770,
            toPort: 1790,
        });

        new ec2.CfnSecurityGroupIngress(this, 'HTTP', {
            groupId: cfnSecurityGroup.attrGroupId,
            description: 'Allow HTTP access from the internet',
            ipProtocol: 'tcp',
            cidrIp: '0.0.0.0/0',
            fromPort: 80,
            toPort: 80,
        });

        new ec2.CfnSecurityGroupIngress(this, 'HTTPS', {
            groupId: cfnSecurityGroup.attrGroupId,
            description: 'Allow HTTPS access from the internet',
            ipProtocol: 'tcp',
            cidrIp: '0.0.0.0/0',
            fromPort: 443,
            toPort: 443,
        });

        new ec2.CfnSecurityGroupIngress(this, 'SSH', {
            groupId: cfnSecurityGroup.attrGroupId,
            description: 'Allow SSH access from the internet',
            ipProtocol: 'tcp',
            cidrIp: '0.0.0.0/0',
            fromPort: 22,
            toPort: 22,
        });

        new ec2.CfnSecurityGroupIngress(this, 'Enable EFA Ingress', {
            groupId: cfnSecurityGroup.attrGroupId,
            sourceSecurityGroupId: cfnSecurityGroup.attrGroupId,
            description: 'Allow all traffic from myself',
            ipProtocol: '-1',
        });

        new ec2.CfnSecurityGroupEgress(this, 'Enable EFA egress', {
            groupId: cfnSecurityGroup.attrGroupId,
            destinationSecurityGroupId: cfnSecurityGroup.attrGroupId,
            description: 'Allow all traffic from myself',
            ipProtocol: '-1',
        });

        new ec2.CfnSecurityGroupEgress(this, 'Enable all outbound egress', {
            groupId: cfnSecurityGroup.attrGroupId,
            description: 'Allow all traffic out',
            ipProtocol: '-1',
            cidrIp: '0.0.0.0/0',
        });

        this.cdi = cfnSecurityGroup;
    }
}
