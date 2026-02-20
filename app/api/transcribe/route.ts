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
    const { data: signedUrlData } = await supabase.storage
      .from("audio")
      .createSignedUrl(file_path, 3600); // 1 hour

    // Trigger Python backend (fire and forget)
    const pythonApiUrl = process.env.PYTHON_API_URL ?? "http://localhost:8000";
    const callbackUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL
        ? `${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"}/api/process-callback`
        : "http://localhost:3000/api/process-callback";

    fetch(`${pythonApiUrl}/process`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        job_id: transcription.id,
        audio_url: signedUrlData?.signedUrl,
        callback_url: callbackUrl,
      }),
    }).catch((err) => {
      console.error("Failed to trigger Python backend:", err);
    });

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
