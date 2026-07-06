import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, getDocs, deleteDoc, collection } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { StudentState } from './types';
import { DEFAULT_STATE } from './initialData';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId); /* CRITICAL: The app will break without this line */
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// 1. Fetch complete user state from Firestore
export async function fetchCompleteState(uid: string): Promise<StudentState | null> {
  const pathPrefix = `users/${uid}`;
  try {
    const profileDoc = await getDoc(doc(db, 'users', uid));
    if (!profileDoc.exists()) {
      return null;
    }
    const profileData = profileDoc.data();

    const collectionsToFetch = [
      'goals', 'exams', 'expenses', 'workouts', 'meals',
      'projects', 'calendar', 'emails', 'files', 'chatHistory'
    ];

    const results = await Promise.all(
      collectionsToFetch.map(async col => {
        try {
          const snap = await getDocs(collection(db, 'users', uid, col));
          return {
            col,
            items: snap.docs.map(d => d.data())
          };
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, `${pathPrefix}/${col}`);
          return { col, items: [] };
        }
      })
    );

    const subcolData: any = {};
    for (const res of results) {
      subcolData[res.col] = res.items;
    }

    return {
      profile: {
        name: profileData.name || DEFAULT_STATE.profile.name,
        college: profileData.college || DEFAULT_STATE.profile.college,
        major: profileData.major || DEFAULT_STATE.profile.major,
        gpaGoal: Number(profileData.gpaGoal) || DEFAULT_STATE.profile.gpaGoal,
        dailyCalorieGoal: Number(profileData.dailyCalorieGoal) || DEFAULT_STATE.profile.dailyCalorieGoal,
        dailyWaterGoal: Number(profileData.dailyWaterGoal) || DEFAULT_STATE.profile.dailyWaterGoal,
        waterIntake: Number(profileData.waterIntake) || DEFAULT_STATE.profile.waterIntake,
      },
      budget: profileData.budget || DEFAULT_STATE.budget,
      goals: subcolData.goals || [],
      exams: subcolData.exams || [],
      expenses: subcolData.expenses || [],
      workouts: subcolData.workouts || [],
      meals: subcolData.meals || [],
      projects: subcolData.projects || [],
      calendar: subcolData.calendar || [],
      emails: subcolData.emails || [],
      files: subcolData.files || [],
      chatHistory: subcolData.chatHistory || [],
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, pathPrefix);
    return null;
  }
}

// 2. Initialize database with default template records for new users
export async function initializeNewUser(uid: string, defaultName: string) {
  const pathPrefix = `users/${uid}`;
  try {
    const profileRef = doc(db, 'users', uid);
    const initialProfile = {
      ...DEFAULT_STATE.profile,
      name: defaultName || DEFAULT_STATE.profile.name
    };

    await setDoc(profileRef, {
      name: initialProfile.name,
      college: initialProfile.college,
      major: initialProfile.major,
      gpaGoal: initialProfile.gpaGoal,
      dailyCalorieGoal: initialProfile.dailyCalorieGoal,
      dailyWaterGoal: initialProfile.dailyWaterGoal,
      waterIntake: initialProfile.waterIntake,
      budget: DEFAULT_STATE.budget,
      updatedAt: new Date().toISOString()
    });

    const collectionsToWrite = [
      { name: 'goals', items: DEFAULT_STATE.goals },
      { name: 'exams', items: DEFAULT_STATE.exams },
      { name: 'expenses', items: DEFAULT_STATE.expenses },
      { name: 'workouts', items: DEFAULT_STATE.workouts },
      { name: 'meals', items: DEFAULT_STATE.meals },
      { name: 'projects', items: DEFAULT_STATE.projects },
      { name: 'calendar', items: DEFAULT_STATE.calendar },
      { name: 'emails', items: DEFAULT_STATE.emails },
      { name: 'files', items: DEFAULT_STATE.files },
      { name: 'chatHistory', items: DEFAULT_STATE.chatHistory }
    ];

    for (const col of collectionsToWrite) {
      for (const item of col.items) {
        await setDoc(doc(db, 'users', uid, col.name, item.id), item);
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, pathPrefix);
  }
}

// 3. Diff and Sync Collection helper
export async function syncCollection<T extends { id: string }>(
  uid: string,
  colName: string,
  newItems: T[],
  oldItems: T[]
) {
  const pathPrefix = `users/${uid}/${colName}`;
  const newMap = new Map(newItems.map(item => [item.id, item]));
  const oldMap = new Map(oldItems.map(item => [item.id, item]));

  // Writes & Updates
  for (const [id, item] of newMap.entries()) {
    const oldItem = oldMap.get(id);
    if (!oldItem || JSON.stringify(item) !== JSON.stringify(oldItem)) {
      try {
        await setDoc(doc(db, 'users', uid, colName, id), item);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `${pathPrefix}/${id}`);
      }
    }
  }

  // Deletions
  for (const id of oldMap.keys()) {
    if (!newMap.has(id)) {
      try {
        await deleteDoc(doc(db, 'users', uid, colName, id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `${pathPrefix}/${id}`);
      }
    }
  }
}

