import { ReplicationConfig } from "./types";

export const accounts: ReplicationConfig = {
  sourceAccounts: {
    A: "REPLACE_WITH_ACCOUNT_A",
    // B: "REPLACE_WITH_ACCOUNT_B",
    // C: "REPLACE_WITH_ACCOUNT_C",
  },
  destinationAccount: "REPLACE_WITH_DESTINATION_ACCOUNT",
  orgIdParameterName: "/my-organization/id",
  region: "us-east-1",
};
