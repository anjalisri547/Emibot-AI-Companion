// server.js
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const OpenAI = require("openai");

dotenv.config();
const app = express();

// ===== Middleware =====
app.use(cors());
app.use(express.json());

// ===== MongoDB Atlas Setup =====
const MONGO_URI = process.env.MONGO_URI; // store your Atlas URI in .env

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB Atlas Connected"))
.catch((err) => console.error("❌ MongoDB Connection Error:", err));

// ===== Schemas & Models =====
const featureSchema = new mongoose.Schema({ title: String, description: String, image: String });
const Feature = mongoose.model("Feature", featureSchema);

const chatFeatureSchema = new mongoose.Schema({
  sectionTitle: String,
  sectionSubtitle: String,
  features: [{ title: String, description: String, image: String }]
});
const ChatFeature = mongoose.model("ChatFeature", chatFeatureSchema);

const voiceFeatureSchema = new mongoose.Schema({ title: String, description: String, image: String });
const VoiceFeature = mongoose.model("VoiceFeature", voiceFeatureSchema);

const rankingSchema = new mongoose.Schema({ rank: Number, name: String, points: Number, image: String });
const Ranking = mongoose.model("Ranking", rankingSchema);

const userRankingSchema = new mongoose.Schema({
  sectionTitle: String,
  sectionDescription: String,
  image: String,
  linkText: String,
  linkPath: String
});
const UserRanking = mongoose.model("UserRanking", userRankingSchema);

const testimonialSchema = new mongoose.Schema({ title: String, description: String, image: String });
const Testimonial = mongoose.model("Testimonial", testimonialSchema);

const participantSchema = new mongoose.Schema({ name: String, bio: String, image: String });
const Participant = mongoose.model("Participant", participantSchema);

const learnMoreSchema = new mongoose.Schema({
  title: String,
  paragraphs: [String],
  buttonText: String,
  buttonPath: String,
  image: String
});
const LearnMore = mongoose.model("LearnMore", learnMoreSchema);

// ===== Routes =====

// Generic POST and GET helper function
function createCRUDRoutes(model, routeName) {
  // POST - insert many
  app.post(`/api/${routeName}`, async (req, res) => {
    try {
      const data = await model.insertMany(req.body);
      res.json(data);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  // GET - fetch all
  app.get(`/api/${routeName}`, async (req, res) => {
    try {
      const data = await model.find();
      // special sort for rankings
      if (routeName === "rankings") data.sort((a, b) => a.rank - b.rank);
      res.json(data);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
}

// Create CRUD routes
createCRUDRoutes(Feature, "features");
createCRUDRoutes(ChatFeature, "chatfeatures");
createCRUDRoutes(VoiceFeature, "voicefeatures");
createCRUDRoutes(Ranking, "rankings");
createCRUDRoutes(UserRanking, "userrankings");
createCRUDRoutes(Testimonial, "testimonials");
createCRUDRoutes(Participant, "participants");
createCRUDRoutes(LearnMore, "learnmore");

// ===== OpenAI Chat Route =====
const openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: "Message is required" });

    const completion = await openaiClient.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: message }],
    });

    const reply = completion.choices?.[0]?.message?.content || "No response";
    res.json({ reply });
  } catch (err) {
    console.error("OpenAI API error:", err);
    res.status(500).json({ error: "Error with OpenAI API" });
  }
});

// ===== Root Route =====
app.get("/", (req, res) => res.send("✅ Server running with MongoDB Atlas!"));

// ===== Start Server =====
const PORT = process.env.PORT || 5500;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
