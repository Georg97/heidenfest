import { query } from '$app/server';

const chat_messages = [
    "Hello, how are you?",
    "I'm doing great, thanks for asking!",
    "What's new with you?",
    "Just working on some code",
    "That sounds interesting",
    "Yeah, it's a TypeScript project",
    "Nice! I love TypeScript",
    "Me too, it's very helpful",
    "Absolutely, type safety is key",
    "kk"
]

export const getTags = query(async () => {
    console.log("called");
    await new Promise((resolve) => setTimeout(resolve, 1000));
	return ["Bana", "Chero", "Tama", "Hana"];
});

export const getRandomMsg = query(async () => {
    for (let i = 0; i < 1000000000; i++) {
        // simulate heavy computation
    }
    const i = Math.floor(Math.random() * chat_messages.length);
    const control = Math.floor(Math.random() * chat_messages.length);
    if (i === control) {
        throw new Error("Random error occurred!");
    }
    return chat_messages[i];
})
