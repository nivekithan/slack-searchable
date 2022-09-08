export type EnvVarName = "SLACK_SIGNING_SECRET";

export const getEnvVar = (key: EnvVarName) => {
  const varValue = process.env[key];

  if (!varValue) {
    throw new Error(`Environment variable ${key} is not defined`);
  }

  return varValue;
};
