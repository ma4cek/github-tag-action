import * as core from '@actions/core'
import {prerelease, rcompare, valid} from 'semver'
import {compareCommits, listTags, Tag} from './github'
import {Await} from './ts'

type Tags = Await<ReturnType<typeof listTags>>

export async function getValidTags(
  prefixRegex: RegExp,
  shouldFetchAllTags: boolean
) {
  const tags = await listTags(shouldFetchAllTags)

  const invalidTags = tags.filter(
    tag =>
      !prefixRegex.test(tag.name) || !valid(tag.name.replace(prefixRegex, ''))
  )

  invalidTags.forEach(name => core.debug(`Found Invalid Tag: ${name}.`))

  const validTags = tags
    .filter(
      tag =>
        prefixRegex.test(tag.name) && valid(tag.name.replace(prefixRegex, ''))
    )
    .sort((a, b) =>
      rcompare(a.name.replace(prefixRegex, ''), b.name.replace(prefixRegex, ''))
    )

  validTags.forEach(tag => core.debug(`Found Valid Tag: ${tag.name}.`))

  return validTags
}

export async function getCommits(
  baseRef: string,
  headRef: string
): Promise<{message: string; hash: string | null}[]> {
  const commits = await compareCommits(baseRef, headRef)

  return commits
    .filter(commit => !!commit.commit.message)
    .map(commit => ({
      message: commit.commit.message,
      hash: commit.sha
    }))
}

export function getBranchFromRef(ref: string) {
  return ref.replace('refs/heads/', '')
}

export function isPr(ref: string): boolean {
  return ref.includes('refs/pull/')
}

export function getLatestTag(
  tags: Tags,
  prefixRegex: RegExp,
  tagPrefix: string
) {
  return (
    tags.find(tag => !prerelease(tag.name.replace(prefixRegex, ''))) || {
      name: `${tagPrefix}0.0.0`,
      commit: {
        sha: 'HEAD'
      }
    }
  )
}

export function getLatestPrereleaseTag(
  tags: Tags,
  identifier: string,
  prefixRegex: RegExp
): Tag | undefined {
  return tags
    .filter(tag => prerelease(tag.name.replace(prefixRegex, '')))
    .find(tag => tag.name.replace(prefixRegex, '').match(identifier))
}
