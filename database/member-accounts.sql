-- 已部署的数据库仅执行一次。保留借还及任务历史；删除账户时只停用登录资格。
IF COL_LENGTH('dbo.members', 'is_active') IS NULL
BEGIN
  ALTER TABLE dbo.members ADD is_active BIT NOT NULL CONSTRAINT DF_members_is_active DEFAULT 1;
END;
