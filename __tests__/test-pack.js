/* global describe it expect */
const { makeFixture } = require('./__helpers__/FixtureFS.js')
const path = require('path')
const pify = require('pify')
const stream = require('stream')
const concat = require('simple-concat')

const { Packfile } = require('isomorphic-git/internal-apis')

describe('pack', () => {
  it('git.pack', async () => {
    // Setup
    let { fs, dir, gitdir } = await makeFixture('test-pack')
    // Test
    let fixture = await pify(fs.readFile)(
      path.join(dir, 'foobar-76178ca22ef818f971fca371d84bce571d474b1d.pack')
    )
    let packstream = Packfile.createStream({
      fs,
      gitdir,
      start: [
        '5a9da3272badb2d3c8dbab463aed5741acb15a33'
      ],
      finish: [
        '36c59d2e14da6b6d85a63ee77b820b838f58c727',
        '962005618b5397b85b2f6ad8c2d72b2ef4cbcdc1'
      ]
    })
    let result = await pify(concat)(packstream)
    expect(fixture.buffer).toEqual(result.buffer)
  })
})
