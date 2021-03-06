'use strict'

const common = require('./common')
const debug = require('debug')('electron-packager')
const path = require('path')
const targets = require('./targets')

const DEFAULT_IGNORES = [
  '/node_modules/electron($|/)',
  '/node_modules/electron-prebuilt(-compile)?($|/)',
  '/node_modules/electron-packager($|/)',
  '/\\.git($|/)',
  '/node_modules/\\.bin($|/)',
  '\\.o(bj)?$'
]

function generateIgnores (opts) {
  if (typeof (opts.ignore) !== 'function') {
    if (opts.ignore && !Array.isArray(opts.ignore)) opts.ignore = [opts.ignore]
    opts.ignore = opts.ignore ? opts.ignore.concat(DEFAULT_IGNORES) : [].concat(DEFAULT_IGNORES)
    if (process.platform === 'linux') {
      opts.ignore.push(common.baseTempDir(opts))
    }

    debug('Ignored path regular expressions:', opts.ignore)
  }
}

function generateOutIgnores (opts) {
  let normalizedOut = opts.out ? path.resolve(opts.out) : null
  let outIgnores = []
  if (normalizedOut === null || normalizedOut === process.cwd()) {
    for (const platform of Object.keys(targets.officialPlatformArchCombos)) {
      for (const arch of targets.officialPlatformArchCombos[platform]) {
        let basenameOpts = {
          arch: arch,
          name: opts.name,
          platform: platform
        }
        outIgnores.push(path.join(process.cwd(), common.generateFinalBasename(basenameOpts)))
      }
    }
  } else {
    outIgnores.push(normalizedOut)
  }

  debug('Ignored paths based on the out param:', outIgnores)

  return outIgnores
}

function userIgnoreFilter (opts) {
  var ignore = opts.ignore || []
  var ignoreFunc = null

  if (typeof (ignore) === 'function') {
    ignoreFunc = file => { return !ignore(file) }
  } else {
    if (!Array.isArray(ignore)) ignore = [ignore]

    ignoreFunc = function filterByRegexes (file) {
      for (var i = 0; i < ignore.length; i++) {
        if (file.match(ignore[i])) {
          return false
        }
      }

      return true
    }
  }

  let outIgnores = generateOutIgnores(opts)

  return function filter (file) {
    if (outIgnores.indexOf(file) !== -1) {
      return false
    }

    var name = file.split(path.resolve(opts.dir))[1]

    /* istanbul ignore if */
    if (path.sep === '\\') {
      // convert slashes so unix-format ignores work
      name = name.replace(/\\/g, '/')
    }

    return ignoreFunc(name)
  }
}

module.exports = {
  generateIgnores: generateIgnores,
  generateOutIgnores: generateOutIgnores,
  userIgnoreFilter: userIgnoreFilter
}
