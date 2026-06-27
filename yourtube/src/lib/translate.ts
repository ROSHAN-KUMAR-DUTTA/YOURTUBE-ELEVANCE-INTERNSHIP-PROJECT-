export const translateText = async (text: string, targetLang: string) => {
  const sourceLang = targetLang === "en" ? "hi" : "en";
  
  try {
    // Primary: MyMemory (reliable, no key needed)
    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}`
    );
    const data = await res.json();

    if (data.responseData?.translatedText) {
      return data.responseData.translatedText;
    }
    throw new Error("No translation");
  } catch {
    return text; // fallback: return original text
  }
};