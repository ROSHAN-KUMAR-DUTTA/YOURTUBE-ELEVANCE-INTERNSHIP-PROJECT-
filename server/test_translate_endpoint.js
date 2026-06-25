import mongoose from "mongoose";
import dotenv from "dotenv";
import comment from "./Modals/comment.js";

dotenv.config();

async function test() {
  await mongoose.connect(process.env.DB_URL);
  
  // create a dummy comment
  const c = new comment({
    commentbody: "This is a beautiful day to code.",
    userid: new mongoose.Types.ObjectId(),
    videoid: new mongoose.Types.ObjectId(),
    usercommented: "TestUser",
    city: "TestCity",
    translations: {}
  });
  await c.save();
  console.log("Created comment:", c._id);

  // simulate translateComment controller
  const lang = "es";
  const text = c.commentbody;

  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${lang}&dt=t&q=${encodeURIComponent(text)}`;
    console.log("Fetching url:", url);
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });
    
    if (!response.ok) {
        console.log("Response status:", response.status);
        console.log("Text:", await response.text());
        throw new Error("HTTP " + response.status);
    }
    
    const data = await response.json();
    console.log("Data:", JSON.stringify(data).substring(0, 50));

    if (!data || !data[0]) {
      console.log("Translation failed (data format)");
    } else {
      const translatedText = data[0].map(i => i[0]).join("");
      console.log("Translated text:", translatedText);

      await comment.updateOne(
        { _id: c._id },
        { $set: { [`translations.${lang}`]: translatedText } }
      );
      console.log("DB update successful");
      
      const updated = await comment.findById(c._id);
      console.log("From DB:", updated.translations);
    }
  } catch (err) {
    console.error("API error:", err);
  }

  // Cleanup
  await comment.findByIdAndDelete(c._id);
  mongoose.connection.close();
}

test();
