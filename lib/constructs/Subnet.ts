import { CfnSubnet, CfnVPC } from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";

interface propsSubnet {
    vpc: CfnVPC
}

export class Subnet extends Construct {
    public readonly web: CfnSubnet

    constructor(scope: Construct, id: string, props: propsSubnet) {
        super(scope, id)

        const vpcId = props.vpc.ref
        // Web subnets
        this.web = new CfnSubnet(this, `web-subnet`, {
            availabilityZone: 'us-east-1a',
            cidrBlock: "10.0.0.0/24",
            vpcId,
            mapPublicIpOnLaunch: false,
            tags: [{ key: 'Name', value: `web-subnet` }]
        })
    }
}