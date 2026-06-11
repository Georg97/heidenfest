import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

// Legacy URL from the Heidenfest landing page — the planning area now lives at /events.
export const load: PageServerLoad = async () => {
	redirect(301, '/events');
};
