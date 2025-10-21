import { db } from "./client.js";

const sessionsRef = db.collection("admin_sessions");

export async function createSession(email, token, expiresAt) {
  await sessionsRef.doc(token).set({
    email,
    expiresAt,
    createdAt: Date.now(),
  });
  return { token, expiresAt };
}

export async function validateSession(token) {
  if (!token) {
    return null;
  }

  const doc = await sessionsRef.doc(token).get();
  if (!doc.exists) {
    return null;
  }

  const session = doc.data();
  const now = Date.now();
  
  if (session.expiresAt <= now) {
    await sessionsRef.doc(token).delete();
    return null;
  }

  // If session will expire in less than 30 minutes, extend it
  const thirtyMinutes = 30 * 60 * 1000;
  if (session.expiresAt - now < thirtyMinutes) {
    session.expiresAt = now + (8 * 60 * 60 * 1000); // Extend by 8 hours
    await sessionsRef.doc(token).update({ 
      expiresAt: session.expiresAt,
      lastRefreshedAt: now
    });
  }

  return {
    ...session,
    // Add warning flag if session will expire in less than 15 minutes
    expiryWarning: session.expiresAt - now < (15 * 60 * 1000)
  };
}

export async function destroySession(token) {
  if (token) {
    await sessionsRef.doc(token).delete();
  }
}

export async function pruneExpiredSessions() {
  const now = Date.now();
  const snapshot = await sessionsRef
    .where("expiresAt", "<=", now)
    .get();

  const batch = db.batch();
  snapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });

  if (snapshot.size > 0) {
    await batch.commit();
  }
}