export const readFileContent = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      // reader.result is string | ArrayBuffer | null
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        resolve(""); // fallback if it's null or unexpected
      }
    };
    reader.readAsDataURL(file);
  });
};
