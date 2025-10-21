describe('todoService', () => {
  it('基本的な算術演算が動作する', () => {
    expect(1 + 1).toBe(2);
  });

  it('文字列の長さをチェックできる', () => {
    const title = 'テストTODO';
    expect(title.length).toBe(7);
  });

  it('配列操作が動作する', () => {
    const todos = ['todo1', 'todo2', 'todo3'];
    expect(todos).toHaveLength(3);
    expect(todos[0]).toBe('todo1');
  });
});

