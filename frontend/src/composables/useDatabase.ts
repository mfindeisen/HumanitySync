import { ref, shallowRef } from 'vue';
import PouchDB from 'pouchdb';
import PouchDBFind from 'pouchdb-find';
import CryptoJS from 'crypto-js';

PouchDB.plugin(PouchDBFind);

export interface FormField {
  id: string;
  type:
    | 'text'
    | 'textarea'
    | 'number'
    | 'boolean'
    | 'select'
    | 'multiselect'
    | 'date'
    | 'location'
    | 'image'
    | 'section';
  label: string;
  required: boolean;
  placeholder?: string;
  hint?: string;
  section_icon?: string;
  options?: { value: string; label: string }[];
  validation?: {
    min?: number;
    max?: number;
    min_length?: number;
    max_length?: number;
  };
  conditions?: {
    field: string;
    operator: 'equals' | 'not_equals';
    value: unknown;
  }[];
}

export interface TemplateDoc {
  _id: string;
  _rev?: string;
  type: 'template';
  version: number;
  title: string;
  metadata: {
    created_at: string;
    author: string;
    target_region: string;
  };
  fields: FormField[];
}

export interface AuditEntry {
  user_id: string;
  action: 'created' | 'updated' | 'conflict_resolved' | 'status_changed';
  timestamp: string;
  note?: string;
}

export interface SubmissionDoc {
  _id: string;
  _rev?: string;
  _conflicts?: string[];
  type: 'submission';
  template_id: string;
  status: 'draft' | 'submitted' | 'completed' | 'approved';
  sync_state: {
    synced: boolean;
    last_attempt?: string;
    device_id: string;
  };
  metadata: {
    surveyor_id: string;
    created_at: string;
    updated_at: string;
    location?: {
      latitude: number;
      longitude: number;
      accuracy_meters: number;
    };
    audit_trail?: AuditEntry[];
  };
  archived_conflicts?: Array<Record<string, unknown>>;
  data: Record<string, unknown>; // encrypted in PouchDB
  decryption_failed?: boolean;
}

export class EncryptedPouchWrapper {
  private db: PouchDB.Database;
  private encryptionKey: string;

  constructor(dbName: string, encryptionKey: string) {
    this.db = new PouchDB(dbName);
    this.encryptionKey = encryptionKey;
  }

  public getRawDb(): PouchDB.Database {
    return this.db;
  }

  public setEncryptionKey(key: string) {
    this.encryptionKey = key;
  }

  public async putAttachment(
    docId: string,
    attachmentId: string,
    rev: string,
    blob: Blob,
    type: string,
  ): Promise<PouchDB.Core.Response> {
    return this.db.putAttachment(docId, attachmentId, rev, blob, type);
  }

  public async getAttachment(docId: string, attachmentId: string): Promise<Blob | Buffer> {
    return this.db.getAttachment(docId, attachmentId);
  }

  private encryptDoc<T extends Record<string, unknown>>(doc: T): T {
    if (doc.type !== 'submission' || (!doc.data && !doc.encrypted_payload) || !this.encryptionKey) {
      return doc;
    }

    const { data, metadata, ...metadataAndSystem } = doc;
    const metaObj = (metadata || {}) as Record<string, unknown>;
    const { location, ...safeMetadata } = metaObj;

    // Encrypt both field responses (data) and sensitive GPS geolocation
    const payloadToEncrypt = {
      data: data || {},
      location: location || null,
    };

    const ciphertext = CryptoJS.AES.encrypt(
      JSON.stringify(payloadToEncrypt),
      this.encryptionKey,
    ).toString();

    return {
      ...metadataAndSystem,
      metadata: safeMetadata,
      encrypted_payload: ciphertext,
    } as unknown as T;
  }

  private decryptDoc<T extends Record<string, unknown>>(doc: T): T {
    const docObj = doc as Record<string, unknown>;
    if (docObj.type !== 'submission' || !docObj.encrypted_payload || !this.encryptionKey) {
      return doc;
    }

    try {
      const { encrypted_payload, metadata, ...metadataAndSystem } = docObj;
      const bytes = CryptoJS.AES.decrypt(encrypted_payload as string, this.encryptionKey);
      const decryptedString = bytes.toString(CryptoJS.enc.Utf8);

      if (!decryptedString) {
        throw new Error('Invalid decryption key or corrupted data');
      }

      const parsedPayload = JSON.parse(decryptedString) as {
        data?: Record<string, unknown>;
        location?: unknown;
      };

      // Support legacy payload structures as well as new payload structure
      const data =
        parsedPayload.data !== undefined
          ? parsedPayload.data
          : (parsedPayload as Record<string, unknown>);
      const location = parsedPayload.location;

      const restoredMetadata = {
        ...((metadata || {}) as Record<string, unknown>),
        ...(location ? { location } : {}),
      };

      return {
        ...metadataAndSystem,
        metadata: restoredMetadata,
        data,
      } as unknown as T;
    } catch (err) {
      console.error('Decryption failed for doc ID:', docObj._id, err);
      return {
        ...docObj,
        decryption_failed: true,
        data: {},
      } as unknown as T;
    }
  }

  public decryptDocument<T>(doc: T): T {
    return this.decryptDoc(doc as unknown as Record<string, unknown>) as unknown as T;
  }

  public async put(doc: Record<string, unknown>): Promise<PouchDB.Core.Response> {
    const encrypted = this.encryptDoc(doc);
    return this.db.put(encrypted);
  }

  public async get(
    id: string,
    options?: PouchDB.Core.GetOptions,
  ): Promise<Record<string, unknown>> {
    const doc = await this.db.get(id, options || {});
    return this.decryptDoc(doc as unknown as Record<string, unknown>);
  }

  public async remove(id: string, rev: string): Promise<PouchDB.Core.Response> {
    return this.db.remove(id, rev);
  }

  public async getAllSubmissions(): Promise<SubmissionDoc[]> {
    const result = await this.db.allDocs({
      include_docs: true,
      startkey: 'submission:',
      endkey: 'submission:\ufff0',
      conflicts: true,
    });

    return result.rows
      .map(
        (row) =>
          this.decryptDoc(
            row.doc as unknown as Record<string, unknown>,
          ) as unknown as SubmissionDoc,
      )
      .filter((doc) => doc && doc.type === 'submission');
  }

  public async getAllTemplates(): Promise<TemplateDoc[]> {
    const result = await this.db.allDocs({
      include_docs: true,
      startkey: 'template:',
      endkey: 'template:\ufff0',
    });

    return result.rows
      .map((row) => row.doc)
      .filter(
        (doc) => doc && (doc as unknown as Record<string, unknown>).type === 'template',
      ) as unknown as TemplateDoc[];
  }
}

// Singleton state
const localDb = shallowRef<PouchDB.Database | null>(null);
const dbWrapper = shallowRef<EncryptedPouchWrapper | null>(null);
const syncHandler = shallowRef<PouchDB.Replication.Sync<Record<string, unknown>> | null>(null);
const encryptionKey = ref<string>('');

export const syncStatus = ref<'idle' | 'syncing' | 'paused' | 'error'>('idle');
export const syncError = ref<unknown>(null);
export const submissions = ref<SubmissionDoc[]>([]);
export const templates = ref<TemplateDoc[]>([]);
export const lowDataMode = ref<boolean>(localStorage.getItem('hs_low_data_mode') === 'true');

export function useDatabase() {
  const setLowDataMode = (enabled: boolean) => {
    lowDataMode.value = enabled;
    localStorage.setItem('hs_low_data_mode', enabled ? 'true' : 'false');
    if (enabled) {
      stopSync();
      syncStatus.value = 'paused';
    }
  };

  const initDb = (dbName: string, pin: string) => {
    // derive a key from password/pin
    const key = CryptoJS.SHA256(pin).toString();
    encryptionKey.value = key;

    if (!dbWrapper.value) {
      dbWrapper.value = new EncryptedPouchWrapper(dbName, key);
      localDb.value = dbWrapper.value.getRawDb();
    } else {
      dbWrapper.value.setEncryptionKey(key);
    }
  };

  const clearDbState = () => {
    stopSync();
    localDb.value = null;
    dbWrapper.value = null;
    encryptionKey.value = '';
    submissions.value = [];
    templates.value = [];
    syncStatus.value = 'idle';
    syncError.value = null;
  };

  const fetchSubmissions = async () => {
    if (!dbWrapper.value) return;
    submissions.value = await dbWrapper.value.getAllSubmissions();
  };

  const fetchTemplates = async () => {
    if (!dbWrapper.value) return;
    templates.value = await dbWrapper.value.getAllTemplates();
  };

  const putSubmission = async (doc: SubmissionDoc) => {
    if (!dbWrapper.value) throw new Error('Database not initialized');
    const result = await dbWrapper.value.put(doc as unknown as Record<string, unknown>);
    await fetchSubmissions();
    return result;
  };

  const getSubmission = async (id: string, options?: PouchDB.Core.GetOptions) => {
    if (!dbWrapper.value) throw new Error('Database not initialized');
    return (await dbWrapper.value.get(id, options)) as unknown as SubmissionDoc;
  };

  const deleteSubmission = async (id: string, rev: string) => {
    if (!dbWrapper.value) throw new Error('Database not initialized');
    const result = await dbWrapper.value.remove(id, rev);
    await fetchSubmissions();
    return result;
  };

  const setupSync = (remoteUrl: string, surveyorId: string, role?: string) => {
    if (!localDb.value) return;
    stopSync();

    const remoteDb = new PouchDB<Record<string, unknown>>(remoteUrl, { skip_setup: true });
    syncStatus.value = 'syncing';

    syncHandler.value = PouchDB.sync(localDb.value, remoteDb, {
      live: !lowDataMode.value,
      retry: !lowDataMode.value,
      back_off_function: (delay) => {
        if (delay === 0) return 1000;
        if (delay < 5000) return delay * 1.5;
        return 10000; // Cap at 10 seconds max pause
      },
      filter: 'app/by_surveyor',
      query_params: { surveyor_id: surveyorId, role },
    })
      .on('change', async (info) => {
        console.log('Sync change:', info);
        await fetchSubmissions();
        await fetchTemplates();
        syncStatus.value = 'syncing';
      })
      .on('paused', (err) => {
        if (err) {
          console.warn('Sync paused due to connection error:', err);
          syncStatus.value = 'paused';
          syncError.value = err;
        } else {
          syncStatus.value = 'idle';
        }
      })
      .on('active', () => {
        syncStatus.value = 'syncing';
      })
      .on('error', (err) => {
        console.error('Sync critical error:', err);
        syncStatus.value = 'error';
        syncError.value = err;
      });
  };

  const stopSync = () => {
    if (syncHandler.value) {
      syncHandler.value.cancel();
      syncHandler.value = null;
    }
    syncStatus.value = 'idle';
  };

  return {
    initDb,
    clearDbState,
    dbWrapper,
    localDb,
    encryptionKey,
    syncStatus,
    syncError,
    submissions,
    templates,
    lowDataMode,
    setLowDataMode,
    fetchSubmissions,
    fetchTemplates,
    putSubmission,
    getSubmission,
    deleteSubmission,
    setupSync,
    stopSync,
  };
}
