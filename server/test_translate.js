const text = "Hello world";
const lang = "es";
const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${lang}&dt=t&q=${encodeURIComponent(text)}`;

async function test() {
  try {
    const response = await fetch(url);
    const data = await response.json();
    console.log(data);
    const translatedText = data[0].map(item => item[0]).join("");
    console.log("Translated:", translatedText);
  } catch (err) {
    console.error("Error:", err);
  }
}

test();
