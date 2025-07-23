// Empty Firebase stub to prevent import errors
export const auth = null;
export const db = null;
export const signUpWithEmail = () => Promise.reject("Firebase disabled");
export const signInWithEmail = () => Promise.reject("Firebase disabled");
export const logOut = () => Promise.reject("Firebase disabled");
export const onAuthStateChanged = () => () => {};