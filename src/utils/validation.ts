export const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const isValidUrl = (url: string): boolean => {
  // Allows optional http(s):// prefix, requires at least one dot (TLD), optional path/query
  const urlRegex = /^(https?:\/\/)?[\w-]+(\.[\w-]+)+([/?#].*)?$/i;
  return urlRegex.test(url.trim());
};
