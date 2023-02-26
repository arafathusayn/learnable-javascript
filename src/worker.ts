import { runCode } from "./run-code.js";

export const runCodeInWorker = (
  code: string,
  maxValues: number,
):
  | ReturnType<typeof runCode>
  | {
      type: "error";
      message?: string;
    } => {
  try {
    const params = {
      code,
      max: maxValues,
      outputFormat: "map" as const,
    };

    return runCode(params);
  } catch (error) {
    const message = {
      type: "error",
      message:
        (error as Error).stack?.split("\n")[0] || (error as Error).message,
    } as const;

    return message;
  }
};
