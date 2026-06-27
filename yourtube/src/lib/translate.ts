export const translateText = async (text: string, targetLang: string) => {
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url);
    const data = await res.json();
    return data[0].map((i: any) => i[0]).filter(Boolean).join('');
  } catch {
    return text;
  }
};