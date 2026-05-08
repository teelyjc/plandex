CREATE TABLE [dbo].[Workspace] (
    [id] NVARCHAR(1000) NOT NULL,
    [ownerId] NVARCHAR(1000) NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Workspace_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Workspace_pkey] PRIMARY KEY CLUSTERED ([id])
);

CREATE TABLE [dbo].[Users] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [email] NVARCHAR(1000) NULL,
    [color] NVARCHAR(1000) NOT NULL CONSTRAINT [Users_color_df] DEFAULT '#35624a',
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Users_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Users_pkey] PRIMARY KEY CLUSTERED ([id])
);

CREATE TABLE [dbo].[Board] (
    [id] NVARCHAR(1000) NOT NULL,
    [workspaceId] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(1000) NOT NULL,
    [columnOrder] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Board_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Board_pkey] PRIMARY KEY CLUSTERED ([id])
);

CREATE TABLE [dbo].[Label] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [color] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [Label_pkey] PRIMARY KEY CLUSTERED ([id])
);

CREATE TABLE [dbo].[Task] (
    [id] NVARCHAR(1000) NOT NULL,
    [boardId] NVARCHAR(1000) NOT NULL,
    [ownerId] NVARCHAR(1000) NULL,
    [assigneeId] NVARCHAR(1000) NULL,
    [title] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(1000) NOT NULL,
    [status] NVARCHAR(1000) NOT NULL,
    [priority] NVARCHAR(1000) NOT NULL,
    [assignee] NVARCHAR(1000) NOT NULL,
    [startDate] DATETIME2 NOT NULL,
    [dueDate] DATETIME2 NOT NULL,
    [estimateHours] INT NOT NULL,
    [tags] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Task_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Task_pkey] PRIMARY KEY CLUSTERED ([id])
);

CREATE TABLE [dbo].[TaskLabel] (
    [taskId] NVARCHAR(1000) NOT NULL,
    [labelId] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [TaskLabel_pkey] PRIMARY KEY CLUSTERED ([taskId], [labelId])
);

CREATE TABLE [dbo].[TaskDependency] (
    [taskId] NVARCHAR(1000) NOT NULL,
    [dependencyId] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [TaskDependency_pkey] PRIMARY KEY CLUSTERED ([taskId], [dependencyId])
);

CREATE TABLE [dbo].[TaskNote] (
    [id] NVARCHAR(1000) NOT NULL,
    [taskId] NVARCHAR(1000) NOT NULL,
    [authorId] NVARCHAR(1000) NULL,
    [content] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [TaskNote_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [TaskNote_pkey] PRIMARY KEY CLUSTERED ([id])
);

CREATE TABLE [dbo].[TodoItem] (
    [id] NVARCHAR(1000) NOT NULL,
    [workspaceId] NVARCHAR(1000) NOT NULL,
    [taskId] NVARCHAR(1000) NULL,
    [title] NVARCHAR(1000) NOT NULL,
    [done] BIT NOT NULL CONSTRAINT [TodoItem_done_df] DEFAULT 0,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [TodoItem_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [TodoItem_pkey] PRIMARY KEY CLUSTERED ([id])
);

ALTER TABLE [dbo].[Board]
ADD CONSTRAINT [Board_workspaceId_fkey]
FOREIGN KEY ([workspaceId]) REFERENCES [dbo].[Workspace]([id])
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE [dbo].[Workspace]
ADD CONSTRAINT [Workspace_ownerId_fkey]
FOREIGN KEY ([ownerId]) REFERENCES [dbo].[Users]([id])
ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE [dbo].[Task]
ADD CONSTRAINT [Task_boardId_fkey]
FOREIGN KEY ([boardId]) REFERENCES [dbo].[Board]([id])
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE [dbo].[Task]
ADD CONSTRAINT [Task_ownerId_fkey]
FOREIGN KEY ([ownerId]) REFERENCES [dbo].[Users]([id])
ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE [dbo].[Task]
ADD CONSTRAINT [Task_assigneeId_fkey]
FOREIGN KEY ([assigneeId]) REFERENCES [dbo].[Users]([id])
ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE [dbo].[TaskLabel]
ADD CONSTRAINT [TaskLabel_taskId_fkey]
FOREIGN KEY ([taskId]) REFERENCES [dbo].[Task]([id])
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE [dbo].[TaskLabel]
ADD CONSTRAINT [TaskLabel_labelId_fkey]
FOREIGN KEY ([labelId]) REFERENCES [dbo].[Label]([id])
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE [dbo].[TaskDependency]
ADD CONSTRAINT [TaskDependency_taskId_fkey]
FOREIGN KEY ([taskId]) REFERENCES [dbo].[Task]([id])
ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE [dbo].[TaskDependency]
ADD CONSTRAINT [TaskDependency_dependencyId_fkey]
FOREIGN KEY ([dependencyId]) REFERENCES [dbo].[Task]([id])
ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE [dbo].[TaskNote]
ADD CONSTRAINT [TaskNote_taskId_fkey]
FOREIGN KEY ([taskId]) REFERENCES [dbo].[Task]([id])
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE [dbo].[TaskNote]
ADD CONSTRAINT [TaskNote_authorId_fkey]
FOREIGN KEY ([authorId]) REFERENCES [dbo].[Users]([id])
ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE [dbo].[TodoItem]
ADD CONSTRAINT [TodoItem_workspaceId_fkey]
FOREIGN KEY ([workspaceId]) REFERENCES [dbo].[Workspace]([id])
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE [dbo].[TodoItem]
ADD CONSTRAINT [TodoItem_taskId_fkey]
FOREIGN KEY ([taskId]) REFERENCES [dbo].[Task]([id])
ON DELETE NO ACTION ON UPDATE NO ACTION;
