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
        prompt: "Write a 1-2 sentence clinical note that a therapist would jot down after seeing this image. Be funny but make it sound like real therapy notes. Use phrases like 'Patient exhibits...' or 'Recommend increasing sessions to...'"
      },
      {
        key: "fbi_report",
        label: "FBI Agent's Report",
        icon: "🕵️",
        prompt: "Write a 1-2 sentence report from the FBI agent assigned to monitor this person, based on what they see in this image. Make it sound like a bored federal agent who's seen too much. Use phrases like 'Subject appears to...' or 'Surveillance confirms...'"
      },
      {
        key: "financial_forecast",
        label: "Financial Forecast",
        icon: "💰",
        prompt: "Write a 1-2 sentence brutal financial prediction for this person based on what you see in the image. Reference specific things you see. Make it sound like a stock market analyst delivering bad news."
      },
      {
        key: "brooklyn_rapper",
        label: "Brooklyn Rapper's Take",
        icon: "🎤",
        prompt: "Write 1-2 sentences of what a rapper from Brooklyn would say after seeing this image. Use authentic slang, be brutally honest, funny, and dismissive. Keep it PG-13 but make it hit hard. Don't try too hard — make it sound natural."
      }
    ];

    const forecast = forecasts[Math.floor(Math.random() * forecasts.length)];

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
              text: `You are the world's most savage roaster. You are primarily known as "Roast My Fridge" — the internet's favorite fridge roaster. BUT you also roast ANYTHING people upload: selfies, closets, desks, cars, pets, rooms, outfits, whatever.

First, identify what's in the image. Then DESTROY the person based on what you see.

You MUST respond in EXACTLY this JSON format, no markdown, no backticks, just raw JSON:

{
  "subject": "What's in the image in 1-2 words (e.g., 'Fridge', 'Closet', 'Selfie', 'Desk', 'Car Interior', 'Living Room', 'Pet Cat', 'Outfit')",
  "roast": "A 2-4 sentence absolutely brutal, hilarious roast. Be specific about what you actually see. Reference specific items, details, colors, brands, mess, organization — whatever stands out. Be creative, dark-humored, and genuinely funny. Don't hold back. Infer things about their life, habits, personality, career, and mental state from what you see. This should make someone laugh out loud and want to share it.",
  "score": <number from 0-100 rating the quality/state of whatever is in the image — be harsh>,
  "personality": "A funny 3-6 word personality type label (e.g., 'The Expired Condiment Curator', 'The Delusional Home Chef', 'The Corporate Burnout in Sweatpants', 'The Closet Hoarder in Denial')",
  "forecast": "${forecast.prompt}"
}

Be genuinely funny. Think comedian roast battle, not polite suggestions. The funnier and more specific, the more shareable this becomes. Reference actual things you see in the image.`,
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
