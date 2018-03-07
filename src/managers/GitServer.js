// @flow
import { Buffer } from 'buffer'
import { GitPktLine } from '../models'
import { GitRefManager } from './GitRefManager'
import path from 'path'

export class GitServerExpress {
  // Return a middleware for handling a git repo endpoint
  static repo ({
    dir,
    gitdir = path.join(dir, '.git'),
    fs
    // TODO: allow authentication mechanisms
  }) {
    return async function (req, res) {
      const serviceUploadPack = GitServerExpress.service({
        dir,
        gitdir,
        fs,
        service: 'git-upload-pack'
      })
      const serviceReceivePack = GitServerExpress.service({
        dir,
        gitdir,
        fs,
        service: 'git-receive-pack'
      })
      const uploadPack = GitServerExpress.send({ dir, gitdir, fs })
      const receivePack = GitServerExpress.receive({ dir, gitdir, fs })
      if (req.method.toLowerCase() === 'get') {
        // > The request MUST contain exactly one query parameter,
        // > `service=$servicename`, where `$servicename` MUST be the service
        // > name the client wishes to contact to complete the operation.
        // > The request MUST NOT contain additional query parameters.
        if (req.url.endsWith('?service=git-upload-pack')) {
          return serviceUploadPack(req, res)
        } else if (req.url.endsWith('?service=git-receive-pack')) {
          return serviceReceivePack(req, res)
        } else {
          // > If the server does not recognize the requested service name, or the
          // > requested service name has been disabled by the server administrator,
          // > the server MUST respond with the `403 Forbidden` HTTP status code.
          return res.writeHead(403)
        }
      } else if (req.method.toLowerCase() === 'post') {
        if (req.url.endsWith('/git-upload-pack')) {
          return uploadPack(req, res)
        } else if (req.url.endsWith('/git-receive-pack')) {
          return receivePack(req, res)
        } else {
          return res.writeHead(400)
        }
      }
    }
  }
  // Return a middleware for handling a /info/refs?service=${service} GET request
  static service ({ dir, gitdir = path.join(dir, '.git'), fs, service }) {
    // Respond with the list of capabilities and available refs in this repo
    // Should work as a regular Node createServer handler
    return async function (req, res) {
      res.setHeader('cache-control', 'no-cache, max-age=0, must-revalidate')
      res.setHeader('content-type', `application/x-${service}-advertisement`)
      let buffer = await GitServerBuffer.service({ dir, gitdir, fs, service })
      res.end(buffer)
    }
  }
  // Return a middleware for handling a /git-upload-pack POST request
  static send ({ dir, gitdir = path.join(dir, '.git'), fs, service }) {
    // Respond with a packfile
    return async function (req, res) {
      res.setHeader('cache-control', 'no-cache, max-age=0, must-revalidate')
      res.setHeader('content-type', `application/x-git-upload-pack-result`)
      let buffer = Buffer.from('')
      res.end(buffer)
    }
  }
  // Return a middleware for handling a /git-receive-pack POST request
  static receive ({ dir, gitdir = path.join(dir, '.git'), fs, service }) {
    // Respond with a packfile
    return async function (req, res) {
      res.setHeader('cache-control', 'no-cache, max-age=0, must-revalidate')
      res.setHeader('content-type', `application/x-git-receive-pack-result`)
      let buffer = Buffer.from('')
      res.end(buffer)
    }
  }
}

export class GitServerBuffer {
  // Note: does not handle HTTP things (like headers)
  static async service ({ dir, gitdir = path.join(dir, '.git'), fs, service }) {
    const HEAD = await GitRefManager.resolve({
      fs,
      gitdir,
      ref: 'HEAD',
      depth: 2
    })
    let capabilities = `shallow deepen-since deepen-not deepen-relative symref=HEAD:${HEAD} agent=isomorphic-git`
    let refs = await GitRefManager.listRefs({ fs, gitdir, filepath: 'refs' })
    let buffers = [GitPktLine.encode(`# service=${service}\n`)]
    let addedcaps = false
    for (const ref of refs) {
      console.log(ref)
      // TODO: Resolve peeled refs corectly.
      if (!ref.includes('^')) {
        let value = await GitRefManager.resolve({ fs, gitdir, ref })
        buffers.push(
          GitPktLine.encode(
            `${value} ${ref}${addedcaps ? '' : `\0${capabilities}`}\n`
          )
        )
        addedcaps = true
      }
    }
    buffers.push(GitPktLine.flush())
    return Buffer.concat(buffers)
  }
  static async send ({ dir, gitdir = path.join(dir, '.git'), fs, service }) {}
  static async receive ({ dir, gitdir = path.join(dir, '.git'), fs, service }) {}
}
