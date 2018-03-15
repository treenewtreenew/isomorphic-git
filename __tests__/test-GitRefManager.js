/* global describe it expect */
const { makeFixture } = require('./__helpers__/FixtureFS.js')
const { assertSnapshot } = require('./__helpers__/assertSnapshot')
const snapshots = require('./__snapshots__/test-GitRefManager.js.snap')
const registerSnapshots = require('./__helpers__/jasmine-snapshots')
const pify = require('pify')
const { managers } = require('isomorphic-git/internal-apis')
const { GitRefManager } = managers

describe('GitRefManager', () => {
  beforeAll(() => {
    registerSnapshots(snapshots)
  })
  it('packedRefs', async () => {
    let { fs, dir, gitdir } = await makeFixture('test-GitRefManager')
    let refs = await GitRefManager.packedRefs({
      fs,
      gitdir
    })
    expect([...refs]).toMatchSnapshot()
  })
  it('listRefs', async () => {
    let { fs, dir, gitdir } = await makeFixture('test-GitRefManager')
    let refs = await GitRefManager.listRefs({
      fs,
      gitdir,
      filepath: 'refs/remotes/origin'
    })
    expect(refs).toMatchSnapshot()
    refs = await GitRefManager.listRefs({
      fs,
      gitdir,
      filepath: 'refs/tags'
    })
    expect(refs).toMatchSnapshot()
  })
  it('listBranches', async () => {
    let { fs, dir, gitdir } = await makeFixture('test-GitRefManager')
    let refs = await GitRefManager.listBranches({
      fs,
      gitdir
    })
    expect(refs).toMatchSnapshot()
    refs = await GitRefManager.listBranches({
      fs,
      gitdir,
      remote: 'origin'
    })
    expect(refs).toMatchSnapshot()
  })
  it('listTags', async () => {
    let { fs, dir, gitdir } = await makeFixture('test-GitRefManager')
    let refs = await GitRefManager.listTags({
      fs,
      gitdir
    })
    expect(refs).toMatchSnapshot()
  })
  it('expands local-tag to refs/tags/local-tag', async () => {
    let { fs, dir, gitdir } = await makeFixture('test-GitRefManager')
    let ref = await GitRefManager.expand({
      fs,
      gitdir,
      ref: 'local-tag'
    })
    expect(ref).toEqual('refs/tags/local-tag')
  })
  it('expands origin/master to refs/remotes/origin/master', async () => {
    let { fs, dir, gitdir } = await makeFixture('test-GitRefManager')
    let ref = await GitRefManager.expand({
      fs,
      gitdir,
      ref: 'origin/master'
    })
    expect(ref).toEqual('refs/remotes/origin/master')
  })
})
