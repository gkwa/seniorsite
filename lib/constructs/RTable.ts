import { CfnRoute, CfnRouteTable, CfnSubnetRouteTableAssociation, CfnVPC } from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import { IGW } from './Igw';
import { Subnet } from './Subnet';

interface RTProps {
    vpc: CfnVPC;
    subnets: Subnet;
    igw: IGW;
}

export class RTable extends Construct {
    constructor(scope: Construct, id: string, props: RTProps) {
        super(scope, id);

        const { vpc, subnets, igw } = props;

        // Route Table
        const webrt = new CfnRouteTable(this, 'cdiA-rtable', {
            vpcId: vpc.ref,
            tags: [{ key: 'Name', value: 'cdiA' }],
        });

        new CfnSubnetRouteTableAssociation(this, 'cdiB-srta', {
            routeTableId: webrt.attrRouteTableId,
            subnetId: subnets.cdiB.attrSubnetId,
        });

        // Add route
        new CfnRoute(this, 'cdiA-route', {
            routeTableId: webrt.attrRouteTableId,
            destinationCidrBlock: '0.0.0.0/0',
            gatewayId: igw.igw.ref,
        });

        // Associate Route Table to both web subnets
        new CfnSubnetRouteTableAssociation(this, 'cdiA-srta', {
            routeTableId: webrt.attrRouteTableId,
            subnetId: subnets.cdiA.attrSubnetId,
        });
    }
}
