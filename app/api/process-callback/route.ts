import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { generateMeetingSummary } from "@/lib/anthropic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { job_id, status, result, error_message, duration_seconds } = body;

    if (!job_id) {
      return NextResponse.json(
        { error: "job_id is required" },
        { status: 400 },
      );
    }

    // Use service role client for backend callbacks
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll: () => [],
          setAll: () => {},
        },
      },
    );

    // Get the transcription to find the user
    const { data: transcription } = await supabase
      .from("transcriptions")
      .select("user_id")
      .eq("id", job_id)
      .single();

    if (!status) {
      return NextResponse.json(
        { error: "status is required" },
        { status: 400 },
      );
    }

    // When complete with segments: save transcript, generate summary, then finalize
    if (status === "complete" && result?.segments?.length) {
      // Step 1: Save transcript and set status to "summarizing"
      const { error: transcriptError } = await supabase
        .from("transcriptions")
        .update({
          status: "summarizing",
          result,
          ...(duration_seconds && { duration_seconds: Math.round(duration_seconds) }),
        })
        .eq("id", job_id);

      if (transcriptError) {
        console.error("Transcript save error:", transcriptError);
        return NextResponse.json(
          { error: "Failed to save transcript" },
          { status: 500 },
        );
      }

      // Step 2: Generate AI summary (non-blocking — transcript is already saved)
      let finalResult = result;
      try {
        const summary = await generateMeetingSummary(result.segments);
        if (summary) {
          finalResult = { ...result, summary };
        }
      } catch (err) {
        console.error("Summary generation failed (transcript still saved):", err);
      }

      // Step 3: Mark as complete with final result (with or without summary)
      const { error: finalError } = await supabase
        .from("transcriptions")
        .update({
          status: "complete",
          result: finalResult,
          completed_at: new Date().toISOString(),
        })
        .eq("id", job_id);

      if (finalError) {
        console.error("Final update error:", finalError);
        return NextResponse.json(
          { error: "Failed to finalize transcription" },
          { status: 500 },
        );
      }
    } else {
      // Non-complete statuses: update normally
      const updateData: Record<string, unknown> = { status };

      if (result) {
        updateData.result = result;
      }
      if (error_message) {
        updateData.error_message = error_message;
      }
      if (duration_seconds) {
        updateData.duration_seconds = Math.round(duration_seconds);
      }
      if (status === "complete") {
        updateData.completed_at = new Date().toISOString();
      }

      const { error: updateError } = await supabase
        .from("transcriptions")
        .update(updateData)
        .eq("id", job_id);

      if (updateError) {
        console.error("Update error:", updateError);
        return NextResponse.json(
          { error: "Failed to update transcription" },
          { status: 500 },
        );
      }
    }

    // Update usage if complete
    if (status === "complete" && duration_seconds && transcription?.user_id) {
      const month = new Date().toISOString().slice(0, 7);
      const minutes = duration_seconds / 60;

      // Upsert usage
      const { data: existing } = await supabase
        .from("usage")
        .select("id, minutes_used")
        .eq("user_id", transcription.user_id)
        .eq("month", month)
        .single();

      if (existing) {
        await supabase
          .from("usage")
          .update({
            minutes_used: Number(existing.minutes_used) + minutes,
          })
          .eq("id", existing.id);
      } else {
        await supabase.from("usage").insert({
          user_id: transcription.user_id,
          minutes_used: minutes,
          month,
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Callback error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
