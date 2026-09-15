// Firebase Configuration
import firebaseAppletConfig from '../../firebase-applet-config.json';

export const firebaseConfig = {
  projectId: firebaseAppletConfig.projectId,
  appId: firebaseAppletConfig.appId,
  apiKey: firebaseAppletConfig.apiKey,
  authDomain: firebaseAppletConfig.authDomain,
  firestoreDatabaseId: firebaseAppletConfig.firestoreDatabaseId || '(default)',
  storageBucket: firebaseAppletConfig.storageBucket,
  messagingSenderId: firebaseAppletConfig.messagingSenderId,
};
