import { Construct } from "constructs";
import { RemovalPolicy } from "aws-cdk-lib";
import { PolicyStatement, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { Subnet } from "./Subnet";
import { SecurityGroup } from "./SecurityGroup";

interface RDSProps {
    subnets: Subnet,
    sg: SecurityGroup
}

export class RDS extends Construct {
    public readonly bucket: Bucket

    constructor (scope: Construct, id: string, props: RDSProps){
        super(scope, id)

        // Create assets bucket
        const bucket = new Bucket(this, 'bucket-php', {
            bucketName: 'assets-rds-endpoint-pm-323912',
            publicReadAccess: false,
            autoDeleteObjects: true,
            removalPolicy: RemovalPolicy.DESTROY
        })

        // Role to allow function to write to the assets bucket
        const writeRole = new Role(this, 'write-role', {
            roleName: 'writeS3Role',
            assumedBy: new ServicePrincipal('lambda.amazonaws.com')
        })

        writeRole.addToPolicy(new PolicyStatement({
            actions: ['s3:PutObject'],
            resources: [`${bucket.bucketArn}/*`]
        }))

        // Export bucket to reference in another construct
        this.bucket = bucket

    }
}