/** Stub — AWS adapter (hosting/compute) comes after the Vercel vertical slice. */

export const AWS_PROVIDER_NAME = "aws";

export class AwsProvider {
  readonly name = "aws";
  readonly capabilities = ["hosting", "database", "storage"] as const;
}
