export type WorkerData =
  | {
      type: "success" | "arguments" | "return";
      result: unknown;
    }
  | {
      type: "error";
      message: string;
    };
