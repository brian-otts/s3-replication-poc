#!/bin/bash

# Cross-Account S3 Log Aggregation Deployment Script
# This script deploys the central logging bucket first, then the source account stack

set -e

echo "🚀 Starting cross-account S3 log aggregation deployment..."

# Check if AWS profiles are configured
if ! aws sts get-caller-identity --profile central-account >/dev/null 2>&1; then
    echo "❌ Error: 'central-account' AWS profile not configured"
    echo "Please configure your AWS profiles first:"
    echo "  aws configure --profile central-account"
    echo "  aws configure --profile source-account-a"
    exit 1
fi

echo ""
echo "📋 Deployment Plan:"
echo "  1. Deploy CentralLoggingAccountStack to central account"
echo "  2. Deploy AccountAStack to source account A"
echo ""

# Step 1: Deploy central logging account
echo "🏗️  Step 1: Deploying central logging account..."
cdk deploy CentralLoggingAccountStack --profile central-account --require-approval never

if [ $? -ne 0 ]; then
    echo "❌ Failed to deploy central logging account"
    exit 1
fi

echo "✅ Central logging account deployed successfully"
echo ""

# Step 2: Deploy source account A
echo "🏗️  Step 2: Deploying source account A..."
cdk deploy SourceAccountAStack --profile source-account-a --require-approval never

if [ $? -ne 0 ]; then
    echo "❌ Failed to deploy source account A"
    exit 1
fi

echo "✅ Source account A deployed successfully"
echo ""

echo "🎉 All stacks deployed successfully!"
echo ""
echo "📊 What was created:"
echo "  • Central logging bucket in destination account"
echo "  • Source ALB log bucket in source account A"
echo "  • S3 replication from source → central bucket"
echo "  • Organization-based cross-account permissions"
echo ""
echo "🧪 To test replication:"
echo "  1. Upload a file to the source bucket"
echo "  2. Check the central bucket for replicated objects under logs/{account-id}/"
echo ""
