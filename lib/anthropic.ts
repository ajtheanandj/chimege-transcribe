import Anthropic from "@anthropic-ai/sdk";

interface Segment {
  speaker: string;
  start: number;
  end: number;
  text: string;
}

export interface MeetingSummary {
  overview: string;
  key_points: string[];
  action_items: string[];
  decisions: string[];
}

const client = new Anthropic();

export async function generateMeetingSummary(
  segments: Segment[],
): Promise<MeetingSummary | null> {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn("ANTHROPIC_API_KEY not set, skipping summary generation");
    return null;
  }

  const transcript = segments
    .map((s) => `[${s.speaker}]: ${s.text}`)
    .join("\n");

  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: `You are analyzing a meeting transcript. Respond in the SAME LANGUAGE as the transcript (if it's in Mongolian, respond in Mongolian; if English, respond in English).

Return a JSON object with these fields:
- "overview": A 2-3 sentence summary of the meeting
- "key_points": Array of 3-7 key discussion points
- "action_items": Array of action items mentioned (empty array if none)
- "decisions": Array of decisions made (empty array if none)

Return ONLY valid JSON, no markdown fences or extra text.

Transcript:
${transcript}`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== "text") return null;

  try {
    return JSON.parse(content.text) as MeetingSummary;
  } catch {
    console.error("Failed to parse Claude summary response:", content.text);
    return null;
  }
}
