#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { CentralLoggingAccountStack, SourceAccountStack } from "../lib/stacks";
import { accounts } from "../config/accounts";

const app = new cdk.App();

const { region, orgIdParameterName, sourceAccounts } = accounts;
new CentralLoggingAccountStack(app, "CentralLoggingAccountStack", {
  env: {
    account: accounts.destinationAccount,
    region,
  },
  orgIdParameterName,
});

for (const [sourceAccountKey, sourceAccountId] of Object.entries(
  sourceAccounts
)) {
  new SourceAccountStack(app, `SourceAccount${sourceAccountKey}Stack`, {
    env: {
      account: sourceAccountId,
      region,
    },
    // centralBucketArn is only hard-coded here for demo purposes
    centralBucketArn: `arn:aws:s3:::central-logs-${accounts.destinationAccount}`,
  });
}
