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

    const forecast = {
      key: "financial_forecast",
      label: "Financial Forecast",
      icon: "💰",
      prompt: "ONE brutal sentence about their financial future based on what you see. Be specific. Be savage."
    };

    const angles = [
      "Find the single detail that exposes who this person really is.",
      "What's the most delusional thing about this image?",
      "What's the saddest thing here that they probably think is fine?",
      "Roast the gap between the effort they put in and the result they got.",
      "What one item here tells you everything you need to know?",
      "What would their ex say about this image?",
      "If this image was a first date, at what point do you leave?",
      "What's the most try-hard thing here?",
    ];
    const angle = angles[Math.floor(Math.random() * angles.length)];
    const seed = Math.floor(Math.random() * 100000);

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      temperature: 1,
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
              text: `You roast images. You're sharp, direct, and actually funny — not "AI funny." No metaphors. No poetry. Talk like a real person who's very witty and a little mean.

THESE are funny. Match this level or don't bother:

"You've got $400 worth of supplements on that counter and a body that suggests none of them are working."

"That's a $3,000 fridge with $11 worth of food in it. You didn't buy a kitchen appliance, you bought furniture."

"There's a gym bag on that chair that clearly hasn't left the house in weeks. At this point it's just a bag."

"Every single condiment in this fridge is open and half-used. You don't finish ANYTHING, do you?"

"You put a plant next to your monitor to make your desk look 'peaceful.' The plant is dying. So is the vibe."

"That bed is unmade but those pillows are decorative. Pick a lane. Are you trying or not?"

"You've got three streaming remotes on that couch and no evidence of a social life anywhere in frame."

"This cat is the most put-together thing in this entire apartment and it's licking its own butt."

RULES:
- 2-3 sentences. Say it and get out.
- Talk directly to them. "You" and "your."
- Be SPECIFIC. Name the actual things you see. Specificity is the whole game.
- Be DIRECT. No flowery language. No "it's almost as if" or "one might say." Just say the thing.
- ${angle}
- Seed: ${seed}
- If something looks genuinely good, flip it: "Oh you've got actual vegetables in here. Who are you trying to impress? Is someone coming over?"
- NEVER roast body, appearance, race, gender, disability. Roast CHOICES, STUFF, and LIFESTYLE.
- The goal: they laugh, screenshot it, and send it to everyone they know.

JSON only. No markdown. No backticks.

{
  "subject": "1-2 words: what's in the image",
  "roast": "2-3 sentences. Direct. Specific. Actually funny. No metaphors.",
  "personality": "3-6 word label that hits (e.g., 'Supplement Rich Life Poor', 'Three Remotes Zero Friends', 'Decorative Pillow Fraud')",
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
