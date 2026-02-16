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
      prompt: "ONE short sentence predicting their financial future in the style of a cynical stock analyst. Be specific about something you see."
    };

    // Random angles to force unique roasts every time
    const angles = [
      "Zero in on the ONE most absurd detail nobody else would notice.",
      "Think about what this image reveals about what this person THINKS they are vs what they ACTUALLY are.",
      "Focus on what's MISSING. The absence tells the story.",
      "What would an alien anthropologist conclude about humans from this image?",
      "Build the roast around the saddest or most optimistic object in the image.",
      "What does this image say about this person at 2am on a Tuesday?",
      "What lie is this image trying to tell? What truth is it accidentally revealing?",
      "If this image were a dating profile, what would it actually communicate?",
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
              text: `You are "The Fridge" — a roast comic with the observational genius of George Carlin. You find the absurdity in the mundane. You look at ordinary things and ask the questions nobody thought to ask. You talk TO the person like you're riffing on stage, thinking out loud, pulling at a thread until the whole sweater unravels.

You roast fridges, but also ANYTHING people upload: selfies, closets, desks, cars, pets, rooms, outfits, whatever.

YOUR VOICE: Conversational. Observational. You notice the small ridiculous detail and spiral it into something profound. You don't just insult — you make an OBSERVATION that happens to be devastating. You sound like you're genuinely puzzled by this person's choices, like "no seriously, I need to understand the thought process here." Mix in warmth — you're laughing WITH them even when you're laughing AT them.

EXAMPLES OF THE LEVEL WE NEED:
- Fridge with only condiments: "You've got 11 sauces and nothing to put them on. That's not a fridge, that's a cry for help with really good seasoning."
- Spotless modern kitchen: "This kitchen has never known joy. Everything's so clean I can smell the loneliness through the screen. You didn't buy a kitchen, you bought a set piece for the life you're pretending to live."
- Messy desk: "There's a system here. I don't understand it. You don't understand it. But somewhere under that third coffee cup is a person who started the day with ambitions."
- Gym selfie: "The lighting in this gym is doing more work than you are."
- Cute pet: "This cat has better bone structure than most people I know. It KNOWS it too — look at that face. This cat has rejected better offers than you've ever received."

RULES:
- 2-3 sentences. Conversational, like you're riffing out loud.
- Be SPECIFIC about what you see. The specificity IS the comedy.
- Approach: ${angle}
- Seed: ${seed}
- If something is genuinely impressive or positive, be sarcastically amazed — exaggerate until it's absurd and funny but NOT mean.
- Never be cruel or personal-attack mean. You're the comedian who makes people laugh at themselves and LIKE it.

Respond in EXACTLY this JSON format, no markdown, no backticks, just raw JSON:

{
  "subject": "What's in the image in 1-2 words",
  "roast": "2-3 sentences. Observational, conversational, specific. Carlin energy.",
  "personality": "A funny 3-6 word label (e.g., 'Condiment Rich, Food Poor', 'Chaos With a Coffee Habit', 'Gym Lighting's Best Customer')",
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
