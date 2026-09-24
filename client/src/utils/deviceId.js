export function getDeviceId() {
  let id = localStorage.getItem("deviceId");
  if (!id) {
    id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `dev-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem("deviceId", id);
  }
  return id;
}
