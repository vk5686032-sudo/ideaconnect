// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { mergeServerTasks } from './TaskBoard';

describe('mergeServerTasks', () => {
  const task = (over) => ({ _id: 't1', title: 'Task', status: 'todo', order: 0, ...over });

  it('lets the server status win over a stale local copy', () => {
    // Regression: the previous merge preferred the whole local object on id
    // collision, so a status change made in the edit modal never reached the
    // board -- the task stayed in COMPLETED with the column count stuck.
    const local = [task({ status: 'completed', order: 0 })];
    const server = [task({ status: 'todo' })];

    expect(mergeServerTasks(local, server)[0].status).toBe('todo');
  });

  it('preserves the optimistic drop order so an in-flight refetch cannot undo it', () => {
    // handleDrop writes `order` locally before the reorder mutation settles, so
    // a refetch landing in that window must not snap the card back.
    const local = [task({ order: 7 })];
    const server = [task({ order: 0 })];

    expect(mergeServerTasks(local, server)[0].order).toBe(7);
  });

  it('takes the server task when there is no local counterpart', () => {
    const server = [task({ _id: 't2', title: 'New' })];

    expect(mergeServerTasks([], server)).toEqual(server);
  });

  it('drops local tasks the server no longer returns', () => {
    const local = [task({ _id: 'gone' }), task({ _id: 't1' })];
    const server = [task({ _id: 't1' })];

    expect(mergeServerTasks(local, server).map((t) => t._id)).toEqual(['t1']);
  });
});
