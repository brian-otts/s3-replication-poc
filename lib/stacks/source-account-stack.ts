import * as cdk from "aws-cdk-lib";
import { BlockPublicAccess, Bucket } from "aws-cdk-lib/aws-s3";
import { Role, ServicePrincipal, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

export interface SourceAccountStackProps extends cdk.StackProps {
  centralBucketArn: string; // only hard-coded here for demo purposes
}

export class SourceAccountStack extends cdk.Stack {
  public readonly sourceLogsBucket: Bucket;
  public readonly replicationRole: Role;

  constructor(scope: Construct, id: string, props: SourceAccountStackProps) {
    super(scope, id, props);
    const { centralBucketArn } = props;
    // Create IAM role for S3 replication
    this.replicationRole = new Role(this, "S3ReplicationRole", {
      assumedBy: new ServicePrincipal("s3.amazonaws.com"),
      description: "Role for S3 replication to central logging bucket",
    });

    // Create S3 bucket for source account logs (replication added after)
    this.sourceLogsBucket = new Bucket(this, "SourceAlbLogsBucket", {
      bucketName: `source-alb-logs-${this.account}`,
      versioned: true, // Required for replication
      enforceSSL: true,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For demo purposes
      autoDeleteObjects: true, // For demo purposes
    });

    // Add replication configuration using L1 construct for cross-account ARN
    // We need L1 because L2 replicationRules expects IBucket, but we have a CloudFormation import
    const cfnBucket = this.sourceLogsBucket.node
      .defaultChild as cdk.aws_s3.CfnBucket;
    cfnBucket.replicationConfiguration = {
      role: this.replicationRole.roleArn,
      rules: [
        {
          id: "ReplicateToCentralLoggingBucket",
          status: "Enabled",
          priority: 1,
          deleteMarkerReplication: {
            status: "Enabled",
          },
          filter: {
            prefix: "",
          },
          destination: {
            bucket: centralBucketArn,
            storageClass: "STANDARD",
            replicationTime: {
              status: "Enabled",
              time: {
                minutes: 15,
              },
            },
            metrics: {
              status: "Enabled",
              eventThreshold: {
                minutes: 15,
              },
            },
          },
        },
      ],
    };

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
        resources: [this.sourceLogsBucket.bucketArn],
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
        resources: [`${centralBucketArn}/*`],
      })
    );

    // Add missing permission to list the destination bucket (required for replication)
    this.replicationRole.addToPolicy(
      new PolicyStatement({
        sid: "AllowDestinationBucketList",
        actions: ["s3:ListBucket"],
        resources: [centralBucketArn],
      })
    );
  }
}
