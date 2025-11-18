export enum UserRole {
  User = "User",
  SuperUser = "Super User",
  Admin = "Admin",
  SuperAdmin = "Super Admin",
}

export enum Permission {
  UserAll = "user:all",
  SuperUserAll = "super:user:all",
  AdminAll = "admin:all",
  SuperAdminAll = "super:all",
}

export const ROLE_PERMISSIONS_MAP = {
  [UserRole.User]: [Permission.UserAll],
  [UserRole.SuperUser]: [Permission.UserAll, Permission.SuperUserAll],
  [UserRole.Admin]: [Permission.UserAll, Permission.SuperUserAll, Permission.AdminAll],
  [UserRole.SuperAdmin]: [Permission.UserAll, Permission.SuperUserAll, Permission.AdminAll, Permission.SuperAdminAll],
};

export enum FeaturePermission {
  AddAssistantInPromptExecutionArea = "AddAssistantInPromptExecutionArea",
  EditAssistantInPromptExecutionArea = "EditAssistantInPromptExecutionArea",
  AddCategoryInCategoryList = "AddCategoryInCategoryList",
  EditCategoryInCategoryForm = "EditCategoryInCategoryForm",
  AddKnowledgeBaseInKnowledgeBaseList = "AddKnowledgeBaseInKnowledgeBaseList",
  EditKnowledgeBaseInKnowledgeBaseList = "EditKnowledgeBaseInKnowledgeBaseList",
  EditKnowledgeBaseInKnowledgeBaseForm = "EditKnowledgeBaseInKnowledgeBaseForm",
  ImportExportAddAssistantInAssistantLibrary = "ImportExportAddAssistantInAssistantLibrary",
  EditAssistantInAssistantLibrary = "EditAssistantInAssistantLibrary",
  EditInstructionInAudioInstructionList = "EditInstructionInAudioInstructionList",
  EditSubInstructionInAudioSubInstructionList = "EditSubInstructionInAudioSubInstructionList",
  EditInstructionInstructionUsecaseForm = "EditInstructionInstructionUsecaseForm",
}

export const FEATURE_PERMISSIONS_MAP: Record<FeaturePermission, Permission[]> = {
  [FeaturePermission.AddAssistantInPromptExecutionArea]: [Permission.SuperAdminAll, Permission.AdminAll, Permission.SuperUserAll],
  [FeaturePermission.EditAssistantInPromptExecutionArea]: [Permission.SuperAdminAll, Permission.AdminAll, Permission.SuperUserAll],
  [FeaturePermission.AddCategoryInCategoryList]: [Permission.SuperAdminAll, Permission.AdminAll, Permission.SuperUserAll],
  [FeaturePermission.EditCategoryInCategoryForm]: [Permission.SuperAdminAll, Permission.AdminAll, Permission.SuperUserAll],
  [FeaturePermission.AddKnowledgeBaseInKnowledgeBaseList]: [Permission.SuperAdminAll, Permission.AdminAll, Permission.SuperUserAll],
  [FeaturePermission.EditKnowledgeBaseInKnowledgeBaseList]: [Permission.SuperAdminAll, Permission.AdminAll, Permission.SuperUserAll],
  [FeaturePermission.EditKnowledgeBaseInKnowledgeBaseForm]: [Permission.SuperAdminAll, Permission.AdminAll, Permission.SuperUserAll],
  [FeaturePermission.ImportExportAddAssistantInAssistantLibrary]: [Permission.SuperAdminAll],
  [FeaturePermission.EditAssistantInAssistantLibrary]: [Permission.SuperAdminAll, Permission.AdminAll, Permission.SuperUserAll],
  [FeaturePermission.EditInstructionInAudioInstructionList]: [Permission.SuperAdminAll, Permission.AdminAll, Permission.SuperUserAll],
  [FeaturePermission.EditSubInstructionInAudioSubInstructionList]: [Permission.SuperAdminAll, Permission.AdminAll, Permission.SuperUserAll],
  [FeaturePermission.EditInstructionInstructionUsecaseForm]: [Permission.SuperAdminAll, Permission.AdminAll, Permission.SuperUserAll],
};

export enum TourType {
  Onboarding = "Onboarding",
  OnboardingNewTenant = "OnboardingNewTenant",
}

export const EncryptedUserPassword =
  "dea510d6a7e4e4c0e5f81ce9a8c9eb4c:43bb938b99ae20bceb3641bccb9c663a7d602db3a189a11e8e3228eb63ce1bc3";
