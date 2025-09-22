import * as cdk from "aws-cdk-lib";
import { BlockPublicAccess, Bucket, BucketPolicy } from "aws-cdk-lib/aws-s3";
import {
  PolicyStatement,
  Effect,
  ServicePrincipal,
  AccountPrincipal,
} from "aws-cdk-lib/aws-iam";
import { StringParameter } from "aws-cdk-lib/aws-ssm";
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

    // this.aggregatedAccessLogsBucket.addReplicationPolicy();

    // Create bucket policy to allow replication from prod accounts
    // const bucketPolicy = new BucketPolicy(this, "CentralLogsBucketPolicy", {
    //   bucket: this.aggregatedAccessLogsBucket,
    // });

    // Allow S3 replication service to write to this bucket
    this.aggregatedLogsBucket.addToResourcePolicy(
      new PolicyStatement({
        sid: "AllowS3ReplicationService",
        effect: Effect.ALLOW,
        principals: [new ServicePrincipal("s3.amazonaws.com")],
        actions: ["s3:ReplicateObject"],
        resources: [this.aggregatedLogsBucket.arnForObjects("*")],
        conditions: {
          StringEquals: {
            "s3:x-amz-server-side-encryption": "AES256",
          },
        },
      })
    );

    this.aggregatedLogsBucket.addToResourcePolicy(
      new PolicyStatement({
        sid: "AllowS3ReplicationService",
        effect: Effect.ALLOW,
        principals: [new ServicePrincipal("s3.amazonaws.com")],
        actions: ["s3:ReplicateDelete", "s3:ReplicateTags"],
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

    // Store central bucket name in parameter store for other stacks to reference
    // new StringParameter(this, "CentralBucketNameParameter", {
    //   parameterName: "/logging/central-bucket-name",
    //   stringValue: this.aggregatedAccessLogsBucket.bucketName,
    //   description: "Name of the central logging S3 bucket for log aggregation",
    // });

    // // Output the bucket name for reference
    // new cdk.CfnOutput(this, "CentralLoggingBucketName", {
    //   value: this.aggregatedAccessLogsBucket.bucketName,
    //   description: "Central logging bucket name",
    //   exportName: `CentralLoggingBucketName`,
    // });
  }
}
