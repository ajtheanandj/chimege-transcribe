import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { file_name, file_path } = body;

    if (!file_name || !file_path) {
      return NextResponse.json(
        { error: "file_name and file_path are required" },
        { status: 400 },
      );
    }

    // Create transcription record
    const { data: transcription, error: insertError } = await supabase
      .from("transcriptions")
      .insert({
        user_id: user.id,
        file_name,
        file_url: file_path,
        status: "pending",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to create transcription" },
        { status: 500 },
      );
    }

    // Generate signed URL for the Python backend
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from("audio")
      .createSignedUrl(file_path, 3600); // 1 hour

    if (signedUrlError || !signedUrlData?.signedUrl) {
      console.error("Signed URL error:", signedUrlError);
      await supabase
        .from("transcriptions")
        .update({ status: "failed", error_message: "Failed to generate audio URL" })
        .eq("id", transcription.id);
      return NextResponse.json(
        { error: "Failed to generate audio URL" },
        { status: 500 },
      );
    }

    // Trigger Python backend — await with timeout so we fail fast if unreachable
    const pythonApiUrl = process.env.PYTHON_API_URL ?? "http://localhost:8000";
    const callbackBase = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";
    const callbackUrl = `${callbackBase}/api/process-callback`;

    try {
      const backendRes = await fetch(`${pythonApiUrl}/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_id: transcription.id,
          audio_url: signedUrlData.signedUrl,
          callback_url: callbackUrl,
        }),
        signal: AbortSignal.timeout(10_000),
      });

      if (!backendRes.ok) {
        throw new Error(`Backend returned ${backendRes.status}`);
      }
    } catch (err) {
      console.error("Failed to reach Python backend:", err);

      const errorMsg =
        err instanceof TypeError
          ? "Transcription server is unreachable"
          : `Transcription server error: ${err instanceof Error ? err.message : "unknown"}`;

      // Mark the job as failed so it doesn't sit in "pending" forever
      await supabase
        .from("transcriptions")
        .update({ status: "failed", error_message: errorMsg })
        .eq("id", transcription.id);

      return NextResponse.json(
        { error: errorMsg },
        { status: 502 },
      );
    }

    return NextResponse.json({
      id: transcription.id,
      status: transcription.status,
    });
  } catch (err) {
    console.error("Transcribe API error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
