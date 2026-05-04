import { createAuthClient } from 'better-auth/svelte';

// No baseURL — better-auth uses the current window origin, so the same
// build works on localhost and on the deployed domain.
export const authClient = createAuthClient();
