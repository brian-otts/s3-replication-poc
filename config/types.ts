export interface ReplicationConfig {
  sourceAccounts: {
    A: string;
    // B: string;
    // C: string;
  };
  destinationAccount: string;
  orgIdParameterName: string;
  region: string;
}
