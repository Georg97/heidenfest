import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, parent }) => {
	if (!locals.token) {
		redirect(302, '/login');
	}
	const { user } = await parent();
	if (!user) {
		redirect(302, '/login');
	}
	return {
		name: user.name ?? null
	};
};
