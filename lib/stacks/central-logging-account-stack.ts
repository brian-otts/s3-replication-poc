import * as cdk from "aws-cdk-lib";
import { BlockPublicAccess, Bucket } from "aws-cdk-lib/aws-s3";
import { PolicyStatement, Effect, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

export class CentralLoggingAccountStack extends cdk.Stack {
  public readonly aggregatedLogsBucket: Bucket;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create central logging bucket with versioning enabled (required for replication)
    this.aggregatedLogsBucket = new Bucket(this, "AggregatedAccessLogsBucket", {
      bucketName: `central-logs-${this.account}`,
      versioned: true, // Required for S3 replication
      enforceSSL: true,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true, // Ensure bucket is emptied before deletion
    });

    // Allow S3 replication service to write to this bucket
    this.aggregatedLogsBucket.addToResourcePolicy(
      new PolicyStatement({
        sid: "AllowS3ReplicationService",
        effect: Effect.ALLOW,
        principals: [new ServicePrincipal("s3.amazonaws.com")],
        actions: [
          "s3:ReplicateObject",
          "s3:ReplicateDelete",
          "s3:ReplicateTags",
        ],
        resources: [this.aggregatedLogsBucket.arnForObjects("*")],
      })
    );

    // Allow listing the bucket for replication
    this.aggregatedLogsBucket.addToResourcePolicy(
      new PolicyStatement({
        sid: "AllowS3ReplicationServiceList",
        effect: Effect.ALLOW,
        principals: [new ServicePrincipal("s3.amazonaws.com")],
        actions: ["s3:ListBucket"],
        resources: [this.aggregatedLogsBucket.bucketArn],
      })
    );
  }
}
