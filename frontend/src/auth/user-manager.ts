import { makeRequest } from '@requests/request-manager';
import { PublicUser } from '@typing/content';

export async function getPublicUser(id?: string) {
  const user = await makeRequest<PublicUser>('get-user', {
    id,
  });

  if (!id) {
    // Only store if we're fetching the current user
    localStorage.setItem('user-data', JSON.stringify(user ?? {}));
  }
  return user;
}

export function getCachedPublicUser(): PublicUser | null {
  const data = localStorage.getItem('user-data');
  return data ? JSON.parse(data) : null;
}

export function clearUserData() {
  localStorage.removeItem('user-data');
}
