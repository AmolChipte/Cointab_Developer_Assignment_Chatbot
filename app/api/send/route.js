// simulates processing of a text input and returns a mock response
export async function POST(req) {
  const { text } = await req.json();

  const reply = `You sent: ${text}`;

  return new Response(JSON.stringify({ reply }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
