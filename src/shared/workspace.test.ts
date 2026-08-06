import test from 'node:test'
import assert from 'node:assert/strict'
import { parseWorkspaceRoot, workspaceTag } from './workspace.js'

test('ten sam projekt = ten sam tag po obu stronach', () => {
  assert.equal(workspaceTag('/Users/mac/tsg/Cursor Voice'), workspaceTag('/Users/mac/tsg/Cursor Voice/'))
})

test('różne projekty = różne tagi', () => {
  assert.notEqual(workspaceTag('/Users/mac/a'), workspaceTag('/Users/mac/b'))
})

test('pusta ścieżka = brak tagu (czyta dowolne okno)', () => {
  assert.equal(workspaceTag(''), '')
  assert.equal(workspaceTag(undefined), '')
})

test('tag jest bezpieczny w nazwie pliku (base36, bez myślnika)', () => {
  assert.match(workspaceTag('/Users/mac/tsg/Cursor Voice'), /^[0-9a-z]+$/)
})

test('workspace_roots jako lista JSON', () => {
  assert.equal(parseWorkspaceRoot('{"workspace_roots":["/a/b","/c/d"]}'), '/a/b')
})

test('workspace_roots jako stringowana lista (format Cursora)', () => {
  assert.equal(parseWorkspaceRoot(`{"workspace_roots":"['/Users/mac/tsg/Cursor Voice']"}`), '/Users/mac/tsg/Cursor Voice')
})

test('fallback na cwd, gdy brak workspace_roots', () => {
  assert.equal(parseWorkspaceRoot('{"cwd":"/Users/mac/proj"}'), '/Users/mac/proj')
})

test('payload spoza JSON-a = brak ścieżki', () => {
  assert.equal(parseWorkspaceRoot('nie-json'), '')
})
