import { CfnInternetGateway, CfnVPCGatewayAttachment, CfnVPC } from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

interface IGWProps {
    vpc: CfnVPC;
}

export class IGW extends Construct {
    public readonly igw: CfnInternetGateway;

    constructor(scope: Construct, id: string, props: IGWProps) {
        super(scope, id);

        const { vpc } = props;

        // Create Internet Gateway
        this.igw = new CfnInternetGateway(this, `igw-sbx-cdi`, {
            tags: [{ key: 'Name', value: `igw-sbx-cdi` }],
        });

        // Attach Internet Gateway
        new CfnVPCGatewayAttachment(this, `vpcgw-sbx-cdi`, {
            vpcId: vpc.ref,
            internetGatewayId: this.igw.ref,
        });
    }
}
