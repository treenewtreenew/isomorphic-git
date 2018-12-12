/* eslint-env node, browser, jasmine */
const { makeFixture } = require('./__helpers__/FixtureFS.js')
const snapshots = require('./__snapshots__/test-checkout.js.snap')
const registerSnapshots = require('./__helpers__/jasmine-snapshots')
const pify = require('pify')

const {
  plugins,
  checkout,
  listFiles,
  add,
  commit,
  branch
} = require('isomorphic-git')

describe('checkout', () => {
  beforeAll(() => {
    registerSnapshots(snapshots)
  })

  it('checkout', async () => {
    // Setup
    let { fs, dir, gitdir } = await makeFixture('test-checkout')
    plugins.set('fs', fs)
    await checkout({ dir, gitdir, ref: 'test-branch' })
    let files = await pify(fs.readdir)(dir)
    expect(files.sort()).toMatchSnapshot()
    let index = await listFiles({ dir, gitdir })
    expect(index).toMatchSnapshot()
  })

  it('checkout by SHA', async () => {
    // Setup
    let { fs, dir, gitdir } = await makeFixture('test-checkout')
    plugins.set('fs', fs)
    await checkout({
      dir,
      gitdir,
      ref: 'e10ebb90d03eaacca84de1af0a59b444232da99e'
    })
    let files = await pify(fs.readdir)(dir)
    expect(files.sort()).toMatchSnapshot()
    let index = await listFiles({ dir, gitdir })
    expect(index).toMatchSnapshot()
  })

  it('checkout unfetched branch', async () => {
    // Setup
    let { fs, dir, gitdir } = await makeFixture('test-checkout')
    plugins.set('fs', fs)
    let error = null
    try {
      await checkout({ dir, gitdir, ref: 'missing-branch' })
      throw new Error('Checkout should have failed.')
    } catch (err) {
      error = err
    }
    expect(error).not.toBeNull()
    expect(error.toJSON()).toMatchSnapshot()
    expect(error.caller).toEqual('git.checkout')
  })

  it('checkout file permissions', async () => {
    let { fs, dir, gitdir } = await makeFixture('test-checkout')
    plugins.set('fs', fs)
    await branch({ dir, gitdir, ref: 'other', checkout: true })
    await checkout({ dir, gitdir, ref: 'test-branch' })
    await pify(fs.writeFile)(dir + '/regular-file.txt', 'regular file', {
      mode: 0o666
    })
    await pify(fs.writeFile)(dir + '/executable-file.sh', 'executable file', {
      mode: 0o777
    })
    const expectedRegularFileMode = (await pify(fs.stat)(
      dir + '/regular-file.txt'
    )).mode
    const expectedExecutableFileMode = (await pify(fs.stat)(
      dir + '/executable-file.sh'
    )).mode
    await add({ dir, gitdir, filepath: 'regular-file.txt' })
    await add({ dir, gitdir, filepath: 'executable-file.sh' })
    await commit({
      dir,
      gitdir,
      author: { name: 'Git', email: 'git@example.org' },
      message: 'add files'
    })
    await checkout({ dir, gitdir, ref: 'other' })
    await checkout({ dir, gitdir, ref: 'test-branch' })
    const actualRegularFileMode = (await pify(fs.stat)(
      dir + '/regular-file.txt'
    )).mode
    const actualExecutableFileMode = (await pify(fs.stat)(
      dir + '/executable-file.sh'
    )).mode
    expect(actualRegularFileMode).toEqual(expectedRegularFileMode)
    expect(actualExecutableFileMode).toEqual(expectedExecutableFileMode)
  })
})
