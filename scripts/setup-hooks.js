const { execSync } = require('child_process')
const os = require('os')
const path = require('path')

function run(cmd) {
  try {
    const out = execSync(cmd, { stdio: 'pipe' }).toString().trim()
    console.log(out)
  } catch (err) {
    console.error('Command failed:', cmd)
    console.error(err.message)
    process.exitCode = 1
  }
}

console.log('Configuring git hooks path to .githooks')
run('git config core.hooksPath .githooks')

if (os.platform() !== 'win32') {
  // try to make pre-commit executable on Unix-like systems
  const hookPath = path.resolve(__dirname, '..', '.githooks', 'pre-commit')
  try {
    console.log('Setting executable bit on .githooks/pre-commit')
    execSync(`chmod +x "${hookPath}"`)
    console.log('chmod applied')
  } catch (err) {
    console.warn('Could not set executable bit (ignored):', err.message)
  }
} else {
  console.log('Detected Windows; ensure Node is in PATH so the hook can run')
}

console.log('\nHook setup complete. Use `git status` to verify and try a commit. If you need to bypass the hook, use `--no-verify`.')

