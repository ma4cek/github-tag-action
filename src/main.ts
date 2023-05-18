import * as core from '@actions/core'
import action from './action'

async function run(): Promise<void> {
  try {
    await action()
  } catch (error) {
    if (error instanceof Error)
      core.setFailed(
        `Action failed. Error: ${error.message}, Stack: ${error.stack}`
      )
  }
}

run()
