// Web-push client helpers for the admin app: check support, subscribe this
// device, and unsubscribe it. Subscriptions are per browser/device — the backend
// keeps them keyed by endpoint — so "on this device" is the unit here.
import { adminApi } from "./api/admin";

export function isPushSupported() {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export function currentPermission() {
  return isPushSupported() ? Notification.permission : "unsupported";
}

// VAPID public keys arrive base64url; the PushManager wants raw bytes.
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) {
    output[i] = raw.charCodeAt(i);
  }
  return output;
}

async function ready() {
  // The service worker only registers in production builds (see main.jsx), so
  // this rejects fast on a plain dev server rather than hanging on `ready`.
  if (!isPushSupported()) {
    throw new Error("PUSH_UNSUPPORTED");
  }
  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration) {
    throw new Error("NO_SERVICE_WORKER");
  }
  return registration;
}

export async function getExistingSubscription() {
  if (!isPushSupported()) {
    return null;
  }
  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration) {
    return null;
  }
  return registration.pushManager.getSubscription();
}

/**
 * Turns push on for this device: asks permission, subscribes with the server's
 * VAPID key, and registers the subscription with the backend. Resolves true on
 * success; throws with a code the caller can map to a message.
 */
export async function subscribeThisDevice(token) {
  const registration = await ready();

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("PERMISSION_DENIED");
  }

  const { publicKey } = await adminApi.getPushVapidPublicKey(token);
  if (!publicKey) {
    throw new Error("PUSH_NOT_CONFIGURED");
  }

  const subscription =
    (await registration.pushManager.getSubscription()) ||
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    }));

  await adminApi.savePushSubscription(token, subscription.toJSON());
  return true;
}

/** Turns push off for this device: drops it at the backend and unsubscribes. */
export async function unsubscribeThisDevice(token) {
  const subscription = await getExistingSubscription();
  if (!subscription) {
    return;
  }
  try {
    await adminApi.deletePushSubscription(token, subscription.endpoint);
  } finally {
    await subscription.unsubscribe();
  }
}
