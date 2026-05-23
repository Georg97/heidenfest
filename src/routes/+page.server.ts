import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	return {
		isAuthed: !!locals.user,
		name: locals.user?.name ?? null
	};
};
