import assert from 'node:assert/strict';
import test from 'node:test';
import { useGameStore, nextRequiredCategory } from '../src/store/gameStore.ts';

const reset = () => useGameStore.setState(useGameStore.getInitialState(), true);
const required = () => nextRequiredCategory(useGameStore.getState().lastCategoryPlayed);

test('opening and switching foods before an answer leaves both categories available', () => {
  reset();
  for (const category of ['healthy', 'healthy', 'junk', 'healthy']) {
    useGameStore.getState().selectFood('example', category);
    assert.equal(required(), null);
  }
});

test('a submitted answer requires the opposite category in both directions', () => {
  for (const correct of [true, false]) {
    reset();
    useGameStore.getState().selectFood('apple', 'healthy');
    useGameStore.getState().answerQuiz(correct);
    assert.equal(required(), 'junk');
    useGameStore.getState().resetForNextFood();
    assert.equal(required(), 'junk');
    useGameStore.getState().selectFood('cake', 'junk');
    assert.equal(required(), 'junk');
    useGameStore.getState().selectFood('chocolate', 'junk');
    assert.equal(required(), 'junk');
    useGameStore.getState().answerQuiz(correct);
    assert.equal(required(), 'healthy');
  }
});

test('retrying an answer keeps the next category unchanged', () => {
  reset();
  useGameStore.getState().selectFood('apple', 'healthy');
  useGameStore.getState().answerQuiz(false);
  useGameStore.getState().advanceStep('quiz');
  useGameStore.getState().answerQuiz(true);
  assert.equal(required(), 'junk');
});
