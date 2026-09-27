-- 已部署的 ZJE-Lens 数据库执行一次；只增加引导状态，不修改账户或历史记录。
IF COL_LENGTH('dbo.members', 'onboarding_version') IS NULL
BEGIN
  ALTER TABLE dbo.members ADD onboarding_version INT NOT NULL
    CONSTRAINT DF_members_onboarding_version DEFAULT 0;
END;
