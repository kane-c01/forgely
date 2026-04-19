import { runCli } from './cli/index.js'

const result = await runCli(process.argv.slice(2), {
  stdout: (text: string) => process.stdout.write(text),
  stderr: (text: string) => process.stderr.write(text),
  env: process.env,
})
process.exit(result.exitCode)
