INSERT INTO [dbo].[Workspace] ([id], [name], [description], [createdAt], [updatedAt])
VALUES
    ('workspace_work', 'Work', 'Product and delivery planning.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('workspace_personal', 'Personal', 'Personal planning and routines.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO [dbo].[Board] ([id], [workspaceId], [name], [description], [columnOrder], [createdAt], [updatedAt])
VALUES
    ('board_product', 'workspace_work', 'Product roadmap', 'Plan features from discovery through release.', 'backlog,ready,active,review,done', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('board_personal', 'workspace_personal', 'Personal focus', 'Keep life admin, learning, and recurring work visible.', 'backlog,ready,active,review,done', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO [dbo].[Label] ([id], [name], [color])
VALUES
    ('label_strategy', 'Strategy', '#2563eb'),
    ('label_delivery', 'Delivery', '#16a34a'),
    ('label_risk', 'Risk', '#dc2626'),
    ('label_research', 'Research', '#9333ea');

INSERT INTO [dbo].[Task] (
    [id],
    [boardId],
    [title],
    [description],
    [status],
    [priority],
    [assignee],
    [startDate],
    [dueDate],
    [estimateHours],
    [tags],
    [createdAt],
    [updatedAt]
)
VALUES
    (
        'task_dependency_model',
        'board_product',
        'Map dependency model',
        'Define how blocked work, prerequisites, and release tasks connect.',
        'backlog',
        'High',
        'You',
        '2026-05-08T00:00:00',
        '2026-05-10T00:00:00',
        5,
        'architecture,planning',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        'task_planning_board',
        'board_product',
        'Build planning board',
        'Create the first usable Kanban workflow with readable task cards.',
        'active',
        'High',
        'You',
        '2026-05-09T00:00:00',
        '2026-05-13T00:00:00',
        9,
        'kanban,ui',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        'task_schedule_density',
        'board_product',
        'Review schedule density',
        'Check active workload and decide what can fit this week.',
        'ready',
        'Medium',
        'You',
        '2026-05-11T00:00:00',
        '2026-05-15T00:00:00',
        3,
        'schedule',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        'task_weekly_reset',
        'board_personal',
        'Weekly reset',
        'Clear inboxes, pick priorities, and schedule focused blocks.',
        'ready',
        'Medium',
        'You',
        '2026-05-07T00:00:00',
        '2026-05-07T00:00:00',
        2,
        'routine',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    );

INSERT INTO [dbo].[TaskLabel] ([taskId], [labelId])
VALUES
    ('task_dependency_model', 'label_strategy'),
    ('task_dependency_model', 'label_risk'),
    ('task_planning_board', 'label_delivery'),
    ('task_schedule_density', 'label_research'),
    ('task_weekly_reset', 'label_strategy');

INSERT INTO [dbo].[TaskDependency] ([taskId], [dependencyId])
VALUES
    ('task_planning_board', 'task_dependency_model'),
    ('task_schedule_density', 'task_planning_board');

INSERT INTO [dbo].[TodoItem] ([id], [workspaceId], [taskId], [title], [done], [createdAt])
VALUES
    ('todo_work_inbox', 'workspace_work', NULL, 'Review planning inbox', 0, CURRENT_TIMESTAMP),
    ('todo_list_blocking_scenarios', 'workspace_work', 'task_dependency_model', 'List blocking scenarios', 1, CURRENT_TIMESTAMP),
    ('todo_pick_dependency_direction', 'workspace_work', 'task_dependency_model', 'Pick dependency direction', 0, CURRENT_TIMESTAMP),
    ('todo_drag_between_columns', 'workspace_work', 'task_planning_board', 'Drag tasks between columns', 1, CURRENT_TIMESTAMP),
    ('todo_show_metadata', 'workspace_work', 'task_planning_board', 'Show task metadata clearly', 0, CURRENT_TIMESTAMP),
    ('todo_compare_estimates', 'workspace_work', 'task_schedule_density', 'Compare estimates by day', 0, CURRENT_TIMESTAMP),
    ('todo_personal_inbox', 'workspace_personal', NULL, 'Plan next personal admin block', 0, CURRENT_TIMESTAMP),
    ('todo_process_notes', 'workspace_personal', 'task_weekly_reset', 'Process notes', 0, CURRENT_TIMESTAMP),
    ('todo_choose_top_three', 'workspace_personal', 'task_weekly_reset', 'Choose top three outcomes', 0, CURRENT_TIMESTAMP);
