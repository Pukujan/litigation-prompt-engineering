import { PLATFORM_MODULES } from "../domain/modules.registry.js";

export function createPlatformService() {
  return {
    listModules() {
      return PLATFORM_MODULES;
    }
  };
}
