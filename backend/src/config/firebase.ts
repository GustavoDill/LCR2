import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

let dbInstance: admin.firestore.Firestore | null = null;
let authInstance: admin.auth.Auth | null = null;
let isMockDb = false;

// In-memory document store for local development when credentials are not yet provided
class MockFirestore {
  private collections: Map<string, Map<string, any>> = new Map();

  collection(colName: string) {
    if (!this.collections.has(colName)) {
      this.collections.set(colName, new Map());
    }
    const store = this.collections.get(colName)!;

    return {
      doc: (docId: string) => {
        return {
          get: async () => {
            const data = store.get(docId);
            return {
              exists: !!data,
              id: docId,
              data: () => (data ? JSON.parse(JSON.stringify(data)) : undefined),
            };
          },
          set: async (data: any, options?: { merge?: boolean }) => {
            const current = store.get(docId) || {};
            const finalData = options?.merge ? { ...current, ...data } : { ...data };
            store.set(docId, JSON.parse(JSON.stringify(finalData)));
            return { writeTime: new Date() };
          },
          update: async (data: any) => {
            const current = store.get(docId) || {};
            const finalData = { ...current, ...data };
            store.set(docId, JSON.parse(JSON.stringify(finalData)));
            return { writeTime: new Date() };
          },
          delete: async () => {
            store.delete(docId);
            return { writeTime: new Date() };
          },
        };
      },
      add: async (data: any) => {
        const id = 'gen_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
        store.set(id, JSON.parse(JSON.stringify({ ...data, id })));
        return { id };
      },
      get: async () => {
        const docs = Array.from(store.entries()).map(([id, data]) => ({
          id,
          exists: true,
          data: () => JSON.parse(JSON.stringify(data)),
        }));
        return {
          docs,
          empty: docs.length === 0,
          size: docs.length,
          forEach: (cb: (doc: any) => void) => docs.forEach(cb),
        };
      },
      where: () => ({
        get: async () => {
          const docs = Array.from(store.entries()).map(([id, data]) => ({
            id,
            exists: true,
            data: () => JSON.parse(JSON.stringify(data)),
          }));
          return { docs, empty: docs.length === 0, size: docs.length };
        },
      }),
    };
  }

  doc(docPath: string) {
    const parts = docPath.split('/');
    if (parts.length % 2 !== 0) {
      throw new Error(`Invalid document path: ${docPath}`);
    }
    const docId = parts.pop()!;
    const colPath = parts.join('/');
    return this.collection(colPath).doc(docId);
  }
}

export function initFirebase() {
  if (admin.apps.length > 0) {
    dbInstance = admin.firestore();
    try {
      dbInstance.settings({ ignoreUndefinedProperties: true });
    } catch {
      // settings might already be frozen if called previously
    }
    authInstance = admin.auth();
    return { db: dbInstance, auth: authInstance, isMock: false };
  }

  const jsonRaw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const pathConfig = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  const gcpCreds = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  let credentialFound = false;

  try {
    if (jsonRaw) {
      const parsed = JSON.parse(jsonRaw);
      admin.initializeApp({
        credential: admin.credential.cert(parsed),
      });
      credentialFound = true;
    } else if (pathConfig && fs.existsSync(pathConfig)) {
      const parsed = JSON.parse(fs.readFileSync(pathConfig, 'utf8'));
      admin.initializeApp({
        credential: admin.credential.cert(parsed),
      });
      credentialFound = true;
    } else if (pathConfig && fs.existsSync(path.resolve(process.cwd(), pathConfig))) {
      const parsed = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), pathConfig), 'utf8'));
      admin.initializeApp({
        credential: admin.credential.cert(parsed),
      });
      credentialFound = true;
    } else if (gcpCreds && fs.existsSync(gcpCreds)) {
      admin.initializeApp();
      credentialFound = true;
    }
  } catch (err) {
    console.warn('⚠️ Warning: Failed to initialize Firebase with provided credentials:', err);
  }

  if (credentialFound) {
    dbInstance = admin.firestore();
    try {
      dbInstance.settings({ ignoreUndefinedProperties: true });
    } catch {
      // settings might already be frozen if called previously
    }
    authInstance = admin.auth();
    console.log('✅ Firebase Admin SDK connected to live Firestore project.');
    return { db: dbInstance, auth: authInstance, isMock: false };
  }

  // Fallback to in-memory mock for dev testing if credentials not supplied
  console.log('ℹ️ Notice: No Firebase serviceAccountKey provided. Using local development mock Firestore.');
  isMockDb = true;
  dbInstance = new MockFirestore() as any;
  authInstance = null;

  return { db: dbInstance, auth: null, isMock: true };
}

export const getDb = () => {
  if (!dbInstance) {
    initFirebase();
  }
  return dbInstance!;
};

export const getAuth = () => {
  if (!authInstance && !isMockDb) {
    initFirebase();
  }
  return authInstance;
};

export const isMockFirebase = () => isMockDb;
