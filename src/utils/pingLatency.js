/**
 * Ping Latency Tracker
 *
 * Measures ping response time using WhatsApp
 * outgoing message receipts / SERVER_ACK.
 */

import { WAMessageStatus } from "baileys";

const pendingPings = new Map();
const completedPings = new Map();
const earlyReceipts = new Map();

const makeKey = (jid, id) => `${jid}:${id}`;

const rememberEarlyReceipt = (key) => {
  earlyReceipts.set(key, performance.now());

  setTimeout(() => {
    earlyReceipts.delete(key);
  }, 15_000).unref?.();
};

/**
 * Start tracking before the outgoing ping is sent.
 */
export function startPingTracking() {
  const token = Symbol("ping");

  let resolveLatency;

  const promise = new Promise((resolve) => {
    resolveLatency = resolve;
  });

  const timeout = setTimeout(() => {
    pendingPings.delete(token);
    resolveLatency(null);
  }, 15_000);

  timeout.unref?.();

  pendingPings.set(token, {
    startedAt: performance.now(),
    resolve: resolveLatency,
    timeout,
  });

  return {
    token,
    promise,
  };
}

/**
 * Attach the outgoing WhatsApp message ID
 * to an already-started ping tracker.
 */
export function attachPingMessage(token, jid, messageId) {
  const pending = pendingPings.get(token);

  if (!pending || !jid || !messageId) {
    return false;
  }

  const key = makeKey(jid, messageId);

  pending.key = key;

  /*
   * Receipt may arrive before sendMessage()
   * returns its message object.
   */
  const earlyReceiptAt = earlyReceipts.get(key);

  if (earlyReceiptAt !== undefined) {
    earlyReceipts.delete(key);

    clearTimeout(pending.timeout);
    pendingPings.delete(token);

    const latency = Math.max(
      1,
      Math.round(earlyReceiptAt - pending.startedAt)
    );

    pending.resolve(latency);

    completedPings.set(key, latency);

    setTimeout(() => {
      completedPings.delete(key);
    }, 15_000).unref?.();
  }

  return true;
}

/**
 * Resolve a tracked ping from a group receipt.
 */
export function resolvePingReceipt(update) {
  const jid = update?.key?.remoteJid;
  const id = update?.key?.id;

  if (!jid || !id || !update?.key?.fromMe) {
    return null;
  }

  const key = makeKey(jid, id);

  for (const [token, pending] of pendingPings) {
    if (pending.key !== key) {
      continue;
    }

    clearTimeout(pending.timeout);
    pendingPings.delete(token);

    const latency = Math.max(
      1,
      Math.round(performance.now() - pending.startedAt)
    );

    pending.resolve(latency);

    completedPings.set(key, latency);

    setTimeout(() => {
      completedPings.delete(key);
    }, 15_000).unref?.();

    return latency;
  }

  /*
   * Receipt arrived before attachPingMessage().
   * Keep it briefly so attachPingMessage() can
   * resolve the tracker afterwards.
   */
  rememberEarlyReceipt(key);

  return null;
}

/**
 * Resolve a tracked ping when SERVER_ACK arrives.
 */
export function resolvePingMessage(update) {
  const status = update?.update?.status;
  const jid = update?.key?.remoteJid;
  const id = update?.key?.id;

  if (
    status !== WAMessageStatus.SERVER_ACK ||
    !jid ||
    !id
  ) {
    return null;
  }

  const key = makeKey(jid, id);

  for (const [token, pending] of pendingPings) {
    if (pending.key !== key) {
      continue;
    }

    clearTimeout(pending.timeout);
    pendingPings.delete(token);

    const latency = Math.max(
      1,
      Math.round(performance.now() - pending.startedAt)
    );

    pending.resolve(latency);

    completedPings.set(key, latency);

    setTimeout(() => {
      completedPings.delete(key);
    }, 15_000).unref?.();

    return latency;
  }

  /*
   * SERVER_ACK arrived before attachPingMessage().
   */
  rememberEarlyReceipt(key);

  return null;
}

/**
 * Get a previously completed latency if needed.
 */
export function getPingLatency(jid, messageId) {
  if (!jid || !messageId) {
    return null;
  }

  return completedPings.get(
    makeKey(jid, messageId)
  ) ?? null;
}
