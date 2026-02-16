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

    // Pick a random forecast type
    const forecasts = [
      {
        key: "therapist_notes",
        label: "Therapist's Notes",
        icon: "🧠",
        prompt: "Write ONE short sentence as a therapist's clinical note after seeing this image. Sound like real therapy notes. Example tone: 'Patient exhibits...' or 'Recommend increasing sessions to...'"
      },
      {
        key: "fbi_report",
        label: "FBI Agent's Report",
        icon: "🕵️",
        prompt: "Write ONE short sentence as an FBI agent's surveillance report on this person based on the image. Sound like a bored federal agent. Example tone: 'Subject appears to...' or 'Surveillance confirms...'"
      },
      {
        key: "financial_forecast",
        label: "Financial Forecast",
        icon: "💰",
        prompt: "Write ONE short sentence predicting this person's financial future based on the image. Sound like a stock market analyst. Reference something specific you see."
      },
      {
        key: "brooklyn_rapper",
        label: "Brooklyn Rapper's Take",
        icon: "🎤",
        prompt: "Write ONE short sentence of what a Brooklyn rapper would say seeing this. Authentic slang, PG-13, don't try too hard — keep it natural and dismissive."
      }
    ];

    // Pick a random vibe to keep roasts varied
    const vibes = [
      "Roast them like a stand-up comedian doing crowd work.",
      "Roast them like a disappointed but loving grandparent.",
      "Roast them like a nature documentary narrator observing a strange species.",
      "Roast them like a real estate agent trying to sell this as a lifestyle.",
      "Roast them like a Gordon Ramsay kitchen inspection.",
      "Roast them like a sarcastic best friend who's had enough.",
    ];

    const forecast = forecasts[Math.floor(Math.random() * forecasts.length)];
    const vibe = vibes[Math.floor(Math.random() * vibes.length)];

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
              text: `You are "The Fridge" — the internet's favorite roast machine. You're known for roasting fridges, but you roast ANYTHING people upload: selfies, closets, desks, cars, pets, rooms, outfits, whatever.

YOUR PERSONALITY: You're like that one friend who's effortlessly funny — quick-witted, sharp, culturally aware, a little chaotic. You have BIG energy. You notice the tiny details nobody else would. You're the kind of person everyone wants at the party because your commentary is legendary. You're savage but never cruel — there's always love underneath the jokes. You're the friend who roasts you to your face and you can't stop laughing.

IMPORTANT RULES:
- Keep roasts to 1-2 sentences MAX. Punchy. No paragraphs. Hit hard and get out.
- Be SPECIFIC — reference actual things you see in the image. Colors, brands, items, mess, details.
- NEVER repeat common roast patterns. Every roast should feel fresh and unique.
- When you see something genuinely positive (healthy food, clean space, good outfit, cute pet), flip it — be sarcastically impressed, exaggerate the positivity until it's funny. Example: "Oh WOW look at you with the organic kale and the filtered water, you absolute Pinterest board of a human. Save some wellness for the rest of us."
- Your vibe for THIS roast: ${vibe}
- Don't be mean-spirited or hurtful. Be the kind of savage that makes people screenshot it and send to their friends because they're laughing, not crying.

Respond in EXACTLY this JSON format, no markdown, no backticks, just raw JSON:

{
  "subject": "What's in the image in 1-2 words (e.g., 'Fridge', 'Closet', 'Selfie', 'Desk', 'Car', 'Living Room', 'Cat', 'Outfit')",
  "roast": "1-2 sentences MAX. Punchy, specific, funny. Reference what you actually see.",
  "personality": "A funny 3-6 word label for this person (e.g., 'The Expired Condiment Curator', 'Pinterest Board Come to Life', 'Corporate Burnout in Sweatpants')",
  "forecast": "${forecast.prompt}"
}`,
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

    return res.status(200).json({
      ...result,
      forecast_type: forecast.key,
      forecast_label: forecast.label,
      forecast_icon: forecast.icon,
    });
  } catch (error) {
    console.error("Error:", error);
    return res
      .status(500)
      .json({ error: "Roast machine broke. Try again." });
  }
}
