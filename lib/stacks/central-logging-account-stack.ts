import * as cdk from "aws-cdk-lib";
import { BlockPublicAccess, Bucket } from "aws-cdk-lib/aws-s3";
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
  }
}
