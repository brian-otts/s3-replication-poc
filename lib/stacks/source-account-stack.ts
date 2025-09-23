import * as cdk from "aws-cdk-lib";
import { BlockPublicAccess, Bucket, IBucket } from "aws-cdk-lib/aws-s3";
import { Role, ServicePrincipal, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

export interface SourceAccountStackProps extends cdk.StackProps {
  centralBucket: IBucket;
}

export class SourceAccountStack extends cdk.Stack {
  public readonly sourceLogsBucket: Bucket;
  public readonly replicationRole: Role;

  constructor(scope: Construct, id: string, props: SourceAccountStackProps) {
    super(scope, id, props);

    // Create S3 bucket for source account logs with replication
    this.sourceLogsBucket = new Bucket(this, "SourceAlbLogsBucket", {
      bucketName: `source-alb-logs-${this.account}`,
      versioned: true, // Required for replication
      enforceSSL: true,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true, // Ensure bucket is emptied before deletion
      replicationRules: [
        {
          id: "ReplicateToCentralLogging",
          destination: props.centralBucket,
          priority: 1,
          deleteMarkerReplication: true,
        },
      ],
    });

    // Create IAM role for S3 replication
    this.replicationRole = new Role(this, "S3ReplicationRole", {
      assumedBy: new ServicePrincipal("s3.amazonaws.com"),
      description: "Role for S3 replication to central logging bucket",
    });

    // Add permissions for replication source operations
    this.replicationRole.addToPolicy(
      new PolicyStatement({
        sid: "AllowSourceBucketOperations",
        actions: [
          "s3:GetObjectVersionForReplication",
          "s3:GetObjectVersionAcl",
          "s3:GetObjectVersionTagging",
        ],
        resources: [this.sourceLogsBucket.arnForObjects("*")],
      })
    );

    this.replicationRole.addToPolicy(
      new PolicyStatement({
        sid: "AllowSourceBucketList",
        actions: ["s3:ListBucket"],
        resources: [this.sourceLogsBucket?.bucketArn],
      })
    );

    // Add permissions for replication destination operations
    this.replicationRole.addToPolicy(
      new PolicyStatement({
        sid: "AllowDestinationBucketOperations",
        actions: [
          "s3:ReplicateObject",
          "s3:ReplicateDelete",
          "s3:ReplicateTags",
        ],
        resources: [this.sourceLogsBucket.arnForObjects("*")],
      })
    );
  }
}
