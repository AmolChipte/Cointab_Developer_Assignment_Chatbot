import prisma from "@/lib/db";

// Fetches all chats
export async function GET() {
    const chats = await prisma.chat.findMany({
        include: { messages: true },
        orderBy: { createdAt: "desc" }
    });
    return Response.json(chats);
}

// Creates a new chat with the given title
export async function POST(req) {
    const { title } = await req.json();
    if (!title?.trim()) return new Response("Invalid title", { status: 400 });

    const newChat = await prisma.chat.create({ data: { title } });
    return Response.json(newChat);
}

// Updates the title of an existing chat
export async function PUT(req) {
    const { id, title } = await req.json();
    if (!title?.trim()) return new Response("Invalid title", { status: 400 });

    const updated = await prisma.chat.update({
        where: { id },
        data: { title }
    });
    return Response.json(updated);
}

// Deletes a chat
export async function DELETE(req) {
    const { id } = await req.json();
    await prisma.message.deleteMany({ where: { chatId: id } });
    await prisma.chat.delete({ where: { id } });
    return new Response("Deleted", { status: 200 });
}
