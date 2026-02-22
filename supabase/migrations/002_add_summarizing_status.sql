-- Add 'summarizing' to the transcription status check constraint
alter table transcriptions drop constraint if exists transcriptions_status_check;
alter table transcriptions add constraint transcriptions_status_check
  check (status in ('pending', 'processing', 'converting', 'diarizing', 'transcribing', 'summarizing', 'complete', 'failed'));
