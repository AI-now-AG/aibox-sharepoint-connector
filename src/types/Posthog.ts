export const POSTHOG_API_HOST = "https://eu.i.posthog.com"

export enum EventName {
  AiboxLogin = 'aibox_login',
  AiboxPromptResult = 'aibox_prompt_result',
  AiboxTriggerSurvey =  'aibox_trigger_survey'
}

export enum ScreenName {
  Home = 'home_screen',
  MyAibox = 'my_aibox_screen',
  PromptExecutionArea = 'prompt_execution_area_screen'
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
