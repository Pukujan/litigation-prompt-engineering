export function isHealthResponse(value) {
  return (
    value &&
    typeof value.module === "string" &&
    typeof value.status === "string" &&
    typeof value.timestamp === "string"
  );
}
