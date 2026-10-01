export const logger = {
  info: (msg: string, ...args: unknown[]) =>
    console.log(
      `[${new Date().toISOString()}] [INFO] [Worker]: ${msg}`,
      ...args,
    ),
  warn: (msg: string, ...args: unknown[]) =>
    console.warn(
      `[${new Date().toISOString()}] [WARN] [Worker]: ${msg}`,
      ...args,
    ),
  error: (msg: string, ...args: unknown[]) =>
    console.error(
      `[${new Date().toISOString()}] [ERROR] [Worker]: ${msg}`,
      ...args,
    ),
  debug: (msg: string, ...args: unknown[]) => {
    if (process.env.DEBUG) {
      console.debug(
        `[${new Date().toISOString()}] [DEBUG] [Worker]: ${msg}`,
        ...args,
      );
    }
  },
};
