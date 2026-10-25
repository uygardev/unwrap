// Builds native/macos_services.node for the installed Electron version as a universal (arm64 + x64) binary.
const { execFileSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const nativeDir = path.join(__dirname, '..', 'native')
const nodeGyp = require.resolve('node-gyp/bin/node-gyp.js')
const electronVersion = require('electron/package.json').version
const output = path.join(nativeDir, 'macos_services.node')

const slices = ['arm64', 'x64'].map((arch) => {
  execFileSync(process.execPath, [
    nodeGyp, 'rebuild',
    `--target=${electronVersion}`,
    `--arch=${arch}`,
    '--dist-url=https://electronjs.org/headers'
  ], { cwd: nativeDir, stdio: 'inherit' })
  // Kept outside build/, which the next `rebuild` wipes.
  const slice = path.join(nativeDir, `macos_services-${arch}.node`)
  fs.copyFileSync(path.join(nativeDir, 'build', 'Release', 'macos_services.node'), slice)
  return slice
})

execFileSync('lipo', ['-create', ...slices, '-output', output], { stdio: 'inherit' })
slices.forEach((slice) => fs.rmSync(slice))
console.log(`Built ${path.relative(process.cwd(), output)} for Electron ${electronVersion}`)
