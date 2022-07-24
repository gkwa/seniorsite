import { CfnSubnet, CfnVPC } from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";
import * as cdk from 'aws-cdk-lib';

interface propsSubnet {
    vpc: CfnVPC
}

export class Subnet extends Construct {
    public readonly cdiA: CfnSubnet
    public readonly cdiB: CfnSubnet

    constructor(scope: Construct, id: string, props: propsSubnet) {
        super(scope, id)

        const vpcId = props.vpc.ref

        // CDI subnets
        this.cdiA = new CfnSubnet(this, `cdi-a`, {
            availabilityZone: cdk.Stack.of(this).availabilityZones[0],
            cidrBlock: "10.0.0.0/24",
            vpcId,
            mapPublicIpOnLaunch: false,
            tags: [{ key: 'Name', value: `cdi-a` }]
        })

        this.cdiB = new CfnSubnet(this, `cdi-b`, {
            availabilityZone: cdk.Stack.of(this).availabilityZones[1],
            cidrBlock: "10.0.1.0/24",
            vpcId,
            mapPublicIpOnLaunch: false,
            tags: [{ key: 'Name', value: `cdi-b` }]
        })
    }
}