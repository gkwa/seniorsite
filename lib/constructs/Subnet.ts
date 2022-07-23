import { CfnSubnet, CfnVPC } from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";

interface propsSubnet {
    vpc: CfnVPC
}

export class Subnet extends Construct {
    public readonly web: CfnSubnet
    public readonly webB: CfnSubnet

    constructor(scope: Construct, id: string, props: propsSubnet) {
        super(scope, id)

        const vpcId = props.vpc.ref

        // CDI subnets
        this.web = new CfnSubnet(this, `cdiA-subnet`, {
            availabilityZone: 'us-east-1a',
            cidrBlock: "10.0.0.0/24",
            vpcId,
            mapPublicIpOnLaunch: false,
            tags: [{ key: 'Name', value: `cdiA-subnet` }]
        })

        this.webB = new CfnSubnet(this, `cdiB-subnet`, {
            availabilityZone: 'us-east-1b',
            cidrBlock: "10.0.1.0/24",
            vpcId,
            mapPublicIpOnLaunch: false,
            tags: [{ key: 'Name', value: `cdiB-subnet` }]
        })
    }
}