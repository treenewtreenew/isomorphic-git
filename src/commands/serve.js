import path from 'path'
import http from 'http'
import { GitServerExpress } from '../managers'
import { FileSystem } from '../models'

export async function serve ({
  dir,
  gitdir = path.join(dir, '.git'),
  fs: _fs,
  port = 8080
}) {
  const fs = new FileSystem(_fs)
  const server = http.createServer(GitServerExpress.repo({ gitdir, fs }))
  server.listen(port)
}
