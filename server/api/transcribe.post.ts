// server/api/transcribe.post.ts
import { defineEventHandler, createError, readMultipartFormData } from 'h3'
import { writeFile, unlink } from 'fs/promises'
import { tmpdir } from 'os'
import { join, dirname } from 'path'
import { spawn } from 'child_process'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)

  // 1) parse form
  const parts = await readMultipartFormData(event) || []
  const filePart = parts.find(p => p.name === 'audio')
  if (!filePart?.data) {
    throw createError({ statusCode: 400, message: 'Missing audio file' })
  }

  // 2) write temp file
  const buffer = filePart.data as Buffer
  const mime = filePart.type ?? 'audio/webm'
  const ext = mime.split('/')[1] ?? 'webm'
  const tmpPath = join(tmpdir(), `voice-${Date.now()}.${ext}`)
  await writeFile(tmpPath, buffer)

  // 3) pick Python
  const pythonExec = process.platform === 'win32'
    ? join(process.cwd(), 'server', '.venv', 'Scripts', 'python.exe')
    : 'python3'

  const scriptPath = join(process.cwd(), 'server', 'utils', 'audiototext.py')
  let transcript = ''

  // 4) resolve ffmpeg & ffprobe directories from env
  const ffmpegExe = process.env.FFMPEG_PATH
  const ffprobeExe = process.env.FFPROBE_PATH
  const ffmpegDir = ffmpegExe ? dirname(ffmpegExe) : ''
  const ffprobeDir = ffprobeExe ? dirname(ffprobeExe) : ''

  try {
    // 5) build args: tiny locally, small+API if key present
    const args = [
      scriptPath,
      tmpPath,
      '--task', 'transcribe',
      '--model', 'tiny'     // or 'small' if you want slightly better accuracy on CPU
    ];
    // 6) spawn with updated PATH
    const py = spawn(pythonExec, args, {
      env: {
        ...process.env,
        PATH: [ffmpegDir, ffprobeDir, process.env.PATH]
          .filter(Boolean)
          .join(process.platform === 'win32' ? ';' : ':')
      }
    })

    // catch spawn errors
    py.on('error', err => {
      throw new Error(`Failed to start Python: ${err.message}`)
    })

    // 7) collect stdout
    for await (const chunk of py.stdout) {
      transcript += chunk.toString()
    }

    // 8) collect stderr
    let stderr = ''
    for await (const chunk of py.stderr) {
      stderr += chunk.toString()
    }

    // 9) check exit
    const exitCode = await new Promise<number>(res => py.on('close', res))
    if (exitCode !== 0) {
      throw new Error(`Python exited ${exitCode}:\n${stderr}`)
    }

  } catch (err: any) {
    console.error("⛔ transcription error:", err.message)
    throw createError({
      statusCode: 502,
      message: `Transcription failed: ${err.message}`
    })
  } finally {
    // 10) cleanup
    await unlink(tmpPath).catch(() => { })
  }

  // 11) return transcript
  return transcript.trim()
})