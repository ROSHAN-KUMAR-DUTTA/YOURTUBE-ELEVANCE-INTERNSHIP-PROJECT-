export const translateText = async (text: string, targetLang: string) => {
  const res = await fetch("https://translate.argosopentech.com/translate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      q: text,
      source: "auto",
      target: targetLang,
      format: "text"
    })
  });

  const data = await res.json();
  return data.translatedText;
};