import { MongoClient, Db, Collection, ObjectId } from "mongodb";

const uri = process.env.MONGODB_URI as string | undefined;

// Optimized connection options for serverless environments
const isProduction = process.env.NODE_ENV === 'production';
const isVercel = process.env.VERCEL === '1';

const options = isProduction || isVercel ? {
  // Serverless optimized settings
  serverSelectionTimeoutMS: 10000,
  connectTimeoutMS: 10000,
  socketTimeoutMS: 20000,
  maxPoolSize: 5,
  minPoolSize: 0,
  maxIdleTimeMS: 10000,
  waitQueueTimeoutMS: 10000,
  retryWrites: true,
  retryReads: true,
  heartbeatFrequencyMS: 30000,
  family: 4, // force IPv4 — avoids server selection timeouts where Atlas SRV resolves to an unreachable IPv6 address
} : {
  // Development settings
  serverSelectionTimeoutMS: 15000,
  connectTimeoutMS: 15000,
  socketTimeoutMS: 30000,
  maxPoolSize: 10,
  minPoolSize: 1,
  maxIdleTimeMS: 30000,
  waitQueueTimeoutMS: 10000,
  retryWrites: true,
  retryReads: true,
  heartbeatFrequencyMS: 10000,
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

// Create connection promise
if (!uri) {
  console.warn("MONGODB_URI is not set. Database features will be disabled.");
  clientPromise = Promise.reject(new Error("MONGODB_URI is not set"));
} else {
  if (process.env.NODE_ENV === "development") {
    if (!global._mongoClientPromise) {
      client = new MongoClient(uri, options);
      global._mongoClientPromise = client.connect();
    }
    clientPromise = global._mongoClientPromise;
  } else {
    client = new MongoClient(uri, options);
    // Defer the connection so we don't open sockets during SSG build phase
    clientPromise = Promise.resolve().then(() => client.connect());
  }
}

export async function connectToDatabase(dbName?: string): Promise<Db> {
  if (!uri) {
    const message = "MONGODB_URI is not set. Please add it to .env.local";
    console.error(message);
    throw new Error(message);
  }
  
  try {
    console.log(`[MongoDB] Attempting to connect to database: ${dbName || 'default'}`);
    const startTime = Date.now();
    const client = await clientPromise;
    const connectTime = Date.now() - startTime;
    console.log(`[MongoDB] Connected successfully in ${connectTime}ms`);
    return client.db(dbName);
  } catch (error) {
    console.error("[MongoDB] Connection failed:", {
      error: error instanceof Error ? error.message : error,
      uri: uri ? `${uri.split('@')[0].split('//')[1]}@***` : 'undefined', // Log partial URI without credentials
      dbName,
      timestamp: new Date().toISOString()
    });
    throw new Error(`Failed to connect to database: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Fallback collections for when DB is not available
const createFallbackCollection = () => {
  const chainable = {
    toArray: () => Promise.resolve([]),
    sort: function() { return this; },
    limit: function() { return this; },
    skip: function() { return this; },
  };
  return {
    find: () => chainable,
    findOne: () => Promise.resolve(null),
    insertOne: () => Promise.resolve({ insertedId: "fallback" }),
    updateOne: () => Promise.resolve({ modifiedCount: 0 }),
    deleteOne: () => Promise.resolve({ deletedCount: 0 }),
    deleteMany: () => Promise.resolve({ deletedCount: 0 }),
    countDocuments: () => Promise.resolve(0),
  };
};

export default clientPromise;

// Collection helpers for clarity and type-safety
export type JobDoc = {
  _id?: ObjectId | string;
  userId: string;
  source: "manual" | "url" | "email";
  url?: string;
  company?: string;
  title?: string;
  description?: string;
  keywords?: string[];
  status?: "saved" | "applied" | "interview" | "offer" | "rejected";
  createdAt: Date;
  updatedAt: Date;
};

export type ResumeBlock = {
  id: string;
  type: "summary" | "experience" | "project" | "education" | "skill";
  content: string;
  tags?: string[];
};

export type ResumeDoc = {
  _id?: ObjectId | string;
  userId: string;
  name: string; // e.g., "Default Resume"
  blocks: ResumeBlock[];
  createdAt: Date;
  updatedAt: Date;
};

export type InterviewDoc = {
  _id?: ObjectId | string;
  userId: string;
  jobId: string;
  stage: string;
  when?: Date;
  notes?: string;
  questions?: string[];
  createdAt: Date;
  updatedAt: Date;
};

export type DebriefDoc = {
  _id?: ObjectId | string;
  userId: string;
  jobId: string;
  interviewers?: string[];
  questions?: string[];
  sentiment?: "bad" | "ok" | "good";
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
};

export async function jobsCollection(dbName?: string): Promise<Collection<JobDoc>> {
  const db = await connectToDatabase(dbName);
  return db.collection<JobDoc>("jobs");
}

export async function resumesCollection(dbName?: string): Promise<Collection<ResumeDoc>> {
  const db = await connectToDatabase(dbName);
  return db.collection<ResumeDoc>("resumes");
}

export async function interviewsCollection(dbName?: string): Promise<Collection<InterviewDoc>> {
  const db = await connectToDatabase(dbName);
  return db.collection<InterviewDoc>("interviews");
}

export async function debriefsCollection(dbName?: string): Promise<Collection<DebriefDoc>> {
  const db = await connectToDatabase(dbName);
  return db.collection<DebriefDoc>("debriefs");
}