import * as cdk from "aws-cdk-lib";
import { BlockPublicAccess, Bucket } from "aws-cdk-lib/aws-s3";
import { PolicyStatement, Effect, AnyPrincipal } from "aws-cdk-lib/aws-iam";
import { StringParameter } from "aws-cdk-lib/aws-ssm";
import { Construct } from "constructs";

export interface CentralLoggingAccountStackProps extends cdk.StackProps {
  orgIdParameterName: string;
}

export class CentralLoggingAccountStack extends cdk.Stack {
  public readonly aggregatedLogsBucket: Bucket;

  constructor(
    scope: Construct,
    id: string,
    props: CentralLoggingAccountStackProps
  ) {
    super(scope, id, props);

    // Get organization ID from parameter store
    const organizationId = StringParameter.valueFromLookup(
      this,
      props.orgIdParameterName
    );

    // Create central logging bucket with versioning enabled (required for replication)
    this.aggregatedLogsBucket = new Bucket(this, "AggregatedAccessLogsBucket", {
      bucketName: `central-logs-${this.account}`,
      versioned: true, // Required for S3 replication
      enforceSSL: true,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true, // Ensure bucket is emptied before deletion
    });

    // Organization-based bucket policy for cross-account replication
    // Fixed: Use AnyPrincipal with organization ID and role pattern conditions
    this.aggregatedLogsBucket.addToResourcePolicy(
      new PolicyStatement({
        sid: "AllowOrganizationReplication",
        effect: Effect.ALLOW,
        principals: [new AnyPrincipal()],
        actions: [
          "s3:ReplicateObject",
          "s3:ReplicateDelete",
          "s3:ReplicateTags",
        ],
        resources: [this.aggregatedLogsBucket.arnForObjects("*")],
        conditions: {
          StringEquals: {
            "aws:PrincipalOrgID": organizationId,
          },
          StringLike: {
            "aws:PrincipalArn": "arn:aws:iam::*:role/*S3ReplicationRole*",
          },
        },
      })
    );

    // Allow listing the bucket for replication from organization accounts
    this.aggregatedLogsBucket.addToResourcePolicy(
      new PolicyStatement({
        sid: "AllowOrganizationReplicationList",
        effect: Effect.ALLOW,
        principals: [new AnyPrincipal()],
        actions: ["s3:ListBucket"],
        resources: [this.aggregatedLogsBucket.bucketArn],
        conditions: {
          StringEquals: {
            "aws:PrincipalOrgID": organizationId,
          },
          StringLike: {
            "aws:PrincipalArn": "arn:aws:iam::*:role/*S3ReplicationRole*",
          },
          // Can add tag-based conditions here as well
        },
      })
    );
  }
}
