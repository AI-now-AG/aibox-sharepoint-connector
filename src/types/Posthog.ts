/* eslint-disable @typescript-eslint/no-explicit-any */
export const POSTHOG_API_HOST = "https://eu.i.posthog.com"

export enum EventName {
  AiboxLogin = 'aibox_login',
  AiboxLogout = 'aibox_logout',
  AiboxPromptResult = 'aibox_prompt_result',

  AiboxTriggerSurvey = 'aibox_trigger_survey',
  AiboxImageCreated = 'aibox_image_created',
  AiboxTranscriptionCreated = 'aibox_transcription_created',

  AiboxSubtitleCreated = 'aibox_subtitle_created',
  AiboxAssistantSaved = 'aibox_assistant_saved',
  AiboxKnowledgeBaseSaved = 'aibox_knowledgebase_saved',

  AiboxCategorySaved = 'aibox_category_saved',
  AiboxAudioInstructionSaved = 'aibox_audioinsruction_saved',
  AiboxUsageRequested = 'aibox_usage_requested',

  AiboxRating = 'aibox_rating',
}

export enum ScreenName {
  Home = 'home_screen',
  MyAibox = 'my_aibox_screen',
  PromptExecutionArea = 'prompt_execution_area_screen',
  Dalle3ImageGeneration = 'dalle3_image_generation',
  GptImageGeneration = 'gpt_image_generation',
  FluxImageGeneration = 'flux_image_generation',
  NanoBananaImageGeneration = 'nano_banana_image_generation',
  CreateOrUpdateKnowledgeBase = 'create_or_update_knowledge_base',
  CreateOrUpdateCategory = 'create_or_update_category',
  CreateOrUpdateAudioInstruction = 'create_or_update_audio_instruction',
  BillingUsage = 'billing_usage',
  AddPromptDialog = 'add_prompt_dialog',
  EditPromptDialog = 'edit_prompt_dialog',
}


export interface IdentifyMessage {
  distinctId: string
  properties?: Record<string | number, any>
  disableGeoip?: boolean
}

export interface SendFeatureFlagsOptions {
  onlyEvaluateLocally?: boolean
  personProperties?: Record<string, any>
  groupProperties?: Record<string, Record<string, any>>
  flagKeys?: string[]
}

export interface EventMessage extends IdentifyMessage {
  event: string
  groups?: Record<string, string | number> // Mapping of group type to group id
  sendFeatureFlags?: boolean | SendFeatureFlagsOptions
  timestamp?: Date
  uuid?: string
}

type Property = any;
export type Properties = Record<string, Property>;
