import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export default async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { image, mediaType } = req.body;

    if (!image) {
      return res.status(400).json({ error: "No image provided" });
    }

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType || "image/jpeg",
                data: image,
              },
            },
            {
              type: "text",
              text: `You are the world's most savage fridge roaster. Look at this fridge photo and absolutely DESTROY this person based on what you see (or don't see) inside.

You MUST respond in EXACTLY this JSON format, no markdown, no backticks, just raw JSON:

{
  "roast": "A 2-4 sentence absolutely brutal, hilarious roast. Be specific about what you actually see. Reference specific items. Be creative, dark-humored, and genuinely funny. Don't hold back. Make it personal — infer things about their life, habits, relationship status, career, and mental state from the fridge contents. This should make someone laugh out loud and want to share it.",
  "score": <number from 0-100 rating how well-stocked/organized the fridge is, be harsh>,
  "personality": "A funny 3-6 word personality type label based on the fridge (e.g., 'The Expired Condiment Curator', 'The Takeout Container Archaeologist', 'The Ambitious Meal Prepper Who Gave Up Tuesday')",
  "dating_forecast": "One brutal sentence about their dating prospects based on this fridge"
}

Be genuinely funny. Think comedian roast battle, not polite suggestions. The funnier and more specific, the more shareable this becomes. Reference actual items you see. If the image is not a fridge, roast them for not being able to follow simple instructions.`,
            },
          ],
        },
      ],
    });

    const text = response.content[0].text;
    
    // Try to parse JSON from the response
    let result;
    try {
      result = JSON.parse(text);
    } catch {
      // If JSON parsing fails, try to extract JSON from the text
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Failed to parse AI response");
      }
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error:", error);
    return res
      .status(500)
      .json({ error: "Roast machine broke. Try again." });
  }
}
