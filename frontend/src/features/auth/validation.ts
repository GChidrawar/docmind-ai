// Mirrors the backend's validation rules so errors show before submitting.
export const validateUserName = (v: string) =>
  !v.trim() ? 'Username is required' : v.length < 3 || v.length > 50 ? 'Username must be 3–50 characters' : ''

export const validateEmail = (v: string) =>
  !v.trim() ? 'Email is required' : !/^\S+@\S+\.\S+$/.test(v) ? 'Enter a valid email address' : ''

export const validateNewPassword = (v: string) =>
  !v ? 'Password is required' : v.length < 8 || v.length > 12 ? 'Password must be 8–12 characters' : ''

export const validateExistingPassword = (v: string) => (!v ? 'Password is required' : '')
