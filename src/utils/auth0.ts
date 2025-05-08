import { EnterpriseConnections, SocialProvider } from "$types/Auth0Auth";

export const isEnterpriseConnection = (auth0Sub: string): boolean => {
  const [provider] = auth0Sub?.split("|") ?? [];
  return EnterpriseConnections.includes(provider);
};

export const isSocialConnection = (
  auth0Sub: string,
  socialProvider?: SocialProvider,
): boolean => {
  const [provider] = auth0Sub?.split("|") ?? [];

  if (socialProvider !== undefined) {
    return provider == socialProvider;
  }

  return [SocialProvider.GOOGLE, SocialProvider.WINDOWS].includes(
    provider as SocialProvider,
  );
};
