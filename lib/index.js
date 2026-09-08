// open-cwd — host half (persistent web-surface plugin).
// Serves GET /open-cwd/open?path=<dir> and opens the directory in the OS
// desktop (macOS: open → Finder; Windows: powershell Invoke-Item → Explorer;
// Linux: xdg-open). The browser client fetches this route on button click —
// the same pattern as the shipped deepseek-api-money plugin, bypassing the
// remote-RPC gateway that third-party client bundles cannot await reliably.
import { execFile } from 'node:child_process'
import { stat } from 'node:fs/promises'

export const name = 'open-cwd'
export const inject = ['webServer']

const ROUTE_PREFIX = '/open-cwd'
const OPEN_PATH = '/open-cwd/open'

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload)
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  })
  res.end(body)
}

/** Open one directory path with the platform's native file manager. */
function openInDesktop(path) {
  const platform = process.platform
  return new Promise((resolve, reject) => {
    let command
    let args
    if (platform === 'darwin') {
      command = 'open'
      args = [path]
    } else if (platform === 'win32') {
      command = 'powershell.exe'
      args = ['-NoProfile', '-Command', `Invoke-Item -LiteralPath '${String(path).replace(/'/g, "''")}'`]
    } else if (platform === 'linux') {
      command = 'xdg-open'
      args = [path]
    } else {
      reject(new Error(`unsupported platform: ${platform}`))
      return
    }
    execFile(command, args, { timeout: 15000 }, (error) => {
      if (error) reject(error)
      else resolve()
    })
  })
}

export function apply(ctx) {
  const dispose = ctx.webServer.register({
    kind: 'prefix',
    path: ROUTE_PREFIX,
    handler: async (req, res) => {
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        sendJson(res, 405, { kind: 'error', message: 'method not allowed' })
        return
      }
      const url = new URL(req.url ?? '/', 'http://local')
      if (url.pathname !== OPEN_PATH) {
        sendJson(res, 404, { kind: 'error', message: 'not found' })
        return
      }
      const path = url.searchParams.get('path') ?? ''
      if (path === '') {
        sendJson(res, 400, { kind: 'error', message: 'missing path' })
        return
      }
      try {
        const info = await stat(path)
        if (!info.isDirectory()) throw new Error(`not a directory: ${path}`)
        await openInDesktop(path)
        sendJson(res, 200, { opened: true, path })
      } catch (error) {
        sendJson(res, 500, {
          kind: 'error',
          message: error instanceof Error ? error.message : String(error),
        })
      }
    },
  })
  ctx.effect(() => dispose, 'open-cwd: web route')
}
