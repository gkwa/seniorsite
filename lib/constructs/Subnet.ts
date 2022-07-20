import { CfnSubnet, CfnVPC } from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";

interface propsSubnet {
    vpc: CfnVPC
}

export class Subnet extends Construct {
    public readonly webA: CfnSubnet
    public readonly webB: CfnSubnet

    constructor(scope: Construct, id: string, props: propsSubnet){
        super(scope, id)

        const vpcId = props.vpc.ref
        // Web subnets
        this.webA = new CfnSubnet(this, `webA-subnet`, {
            availabilityZone: 'us-east-1a',
            cidrBlock: "10.0.0.0/24",
            vpcId,
            mapPublicIpOnLaunch: false,
            tags:[{ key: 'Name', value: `webA-subnet` }]
        })

        this.webB = new CfnSubnet(this, `webB-subnet`, {
            availabilityZone: 'us-east-1b',
            cidrBlock: "10.0.1.0/24",
            vpcId,
            mapPublicIpOnLaunch: false,
            tags:[{ key: 'Name', value: `webB-subnet` }]
        })
    }
}