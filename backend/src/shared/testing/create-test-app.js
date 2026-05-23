import express from "express";

/**
 * Minimal Express app for module integration tests.
 * Pass a register function from the module under test.
 */
export function createTestApp(register) {
  const app = express();
  app.use(express.json());
  const context = { eventBus: { emit() {}, on() {} } };
  register(app, context);
  return app;
}
