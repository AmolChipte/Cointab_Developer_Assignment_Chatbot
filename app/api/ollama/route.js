// Handles streaming AI-generated response from a local Ollama (Gemma) model
export async function POST(req) {
    const { prompt } = await req.json();

    const response = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            model: "gemma3:1b",
            prompt,
            stream: true
        })
    });

    return new Response(response.body, {
        headers: { "Content-Type": "application/json" }
    });
}
