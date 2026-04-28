import express from "express";

async function init() {
  try {
    const app = express();
    const PORT = 3000;

    app.get("/", (req, res) => {
      res.status(200).json({ message: "Server Menyala" });
    });

    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Error starting the server:", error);
  }
}
init();
