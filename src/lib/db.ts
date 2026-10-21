import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { readFileSync } from "node:fs";

/** Initialize Firebase Admin once per server process. Set FIREBASE_* credentials in deployment. */
export function getDb(): Firestore {
  if (!getApps().length) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY);
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

    if (serviceAccountPath) {
      const account = JSON.parse(readFileSync(serviceAccountPath, "utf8")) as {
        project_id?: string; client_email?: string; private_key?: string;
      };
      if (!account.project_id || !account.client_email || !account.private_key) {
        throw new Error("Firebase service account JSON must include project_id, client_email, and private_key.");
      }
      initializeApp({
        credential: cert({ ...account, privateKey: normalizePrivateKey(account.private_key) }),
        projectId: projectId || account.project_id,
      });
    } else if (projectId && clientEmail && privateKey) {
      initializeApp({ credential: cert({ projectId, clientEmail, privateKey }), projectId });
    } else {
      initializeApp({ credential: applicationDefault(), ...(projectId ? { projectId } : {}) });
    }
  }
  return getFirestore();
}

function normalizePrivateKey(value?: string): string | undefined {
  if (!value) return undefined;
  let key = value.trim();
  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
    key = key.slice(1, -1);
  }
  return key.replace(/\\\\n/g, "\n").replace(/\\n/g, "\n").replace(/\r\n/g, "\n");
}
