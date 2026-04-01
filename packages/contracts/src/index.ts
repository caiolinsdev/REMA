export type ApiServiceStatus = "ok";

export interface HealthcheckResponse {
  service: string;
  status: ApiServiceStatus;
  environment: string;
}

export interface ApiInfoResponse {
  name: string;
  stack: string[];
  healthcheckUrl: string;
}
