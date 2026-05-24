import { clearFileExchange } from "../../../shared/utils/fileExchangeCleanup.js";

export function createFileExchangeFacade({ config }) {
  return {
    clear(options) {
      return clearFileExchange({
        repoRoot: config.repoRoot,
        ...options
      });
    }
  };
}
