#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { CentralLoggingAccountStack, SourceAccountStack } from "../lib/stacks";

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const app = new cdk.App();
const centralizedLoggingStack = new CentralLoggingAccountStack(
  app,
  "CentralLoggingAccountStack",
  {
    env,
  }
);
new SourceAccountStack(app, "ProdAccountStack", {
  env,
  centralBucket: centralizedLoggingStack.aggregatedLogsBucket,
});
