import * as cdk from "aws-cdk-lib";
import { BlockPublicAccess, Bucket, IBucket } from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";

export interface SourceAccountStackProps extends cdk.StackProps {
  centralBucket: IBucket;
}

export class SourceAccountStack extends cdk.Stack {
  public readonly sourceLogsBucket: Bucket;

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
  }
}
