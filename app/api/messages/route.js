import prisma from "@/lib/db";

// Handles creating and saving a new message to the database
export async function POST(req) {
    const { chatId, sender, text } = await req.json();
    if (!text?.trim()) return new Response("Invalid message", { status: 400 });

    // Save new message to the database using Prisma
    const message = await prisma.message.create({
        data: { chatId, sender, text }
    });

    return Response.json(message);
}
