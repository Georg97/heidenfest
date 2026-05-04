import { fail, message, superValidate } from 'sveltekit-superforms';
import { redirect } from '@sveltejs/kit';
import { zod4 } from 'sveltekit-superforms/adapters';
import { z } from "zod";
import type { Actions, PageServerLoad } from './$types';

export type ContactFormData = {
    name: string;
    email: string;
    message: string;
};

const zodForm = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.email("Invalid email address"),
    message: z.string().min(1, "Message is required")
});

export const load: PageServerLoad = async ({ locals }) => {
    if (!locals.user) {
        redirect(302, '/login');
    }

    const form = await superValidate(zod4(zodForm));
    return { form };
}

export const actions = {
	default: async (event) => {
        const form = await superValidate(event, zod4(zodForm))
        console.log("got form:", form);

        if (!form.valid) {
          // Return { form } and things will just work.
          return fail(400, { form });
        }

        // TODO: Do something with the validated form.data

        // Return the form with a status message
        console.log("returning:", form);
        return message(form, 'Form posted successfully!');
	}
} satisfies Actions;