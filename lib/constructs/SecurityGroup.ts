import { CfnSecurityGroup, CfnVPC, Vpc } from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";
import { aws_ec2 as ec2 } from 'aws-cdk-lib';

interface SGProps { vpc: CfnVPC }

export class SecurityGroup extends Construct {
    public readonly web: CfnSecurityGroup

    constructor(scope: Construct, id: string, props: SGProps) {
        super(scope, id)
        const vpcId = props.vpc.ref

        const cfnSecurityGroup = new ec2.CfnSecurityGroup(this, 'MyCfnSecurityGroup', {
            groupDescription: `web-sg`,
            groupName: `web-sg`,
            tags: [{ key: "Name", value: `web-sg` }],
            vpcId
        });

        const webIngressProperty: ec2.CfnSecurityGroup.IngressProperty = {
            ipProtocol: 'tcp',
            cidrIp: '0.0.0.0/0',
            description: 'Allow HTTP access from the internet',
            fromPort: 80,
            toPort: 80,
            sourceSecurityGroupId: cfnSecurityGroup.ref
        };

        const webIngressProperty2: ec2.CfnSecurityGroup.IngressProperty = {
            ipProtocol: '-1',
            sourceSecurityGroupName: cfnSecurityGroup.groupName,
            description: 'all traffic',
        };

        this.web = cfnSecurityGroup
    }
}