import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, parent }) => {
	if (!locals.token) {
		redirect(302, '/login');
	}
	const { user } = await parent();
	if (!user) {
		redirect(302, '/login');
	}
	return { user };
};
