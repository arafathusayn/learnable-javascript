export type RunCodeParams = {
  code: string;
  max: number;
  functionParameters?: any[];
  outputFormat: "text" | "map";
};

/**
 * @throws {TypeError | Error}
 */
export declare const runCode: ({
  code,
  max,
  functionParameters,
  outputFormat,
}: RunCodeParams) =>
  | Map<string, unknown[] | undefined | Error>
  | string
  | undefined;
