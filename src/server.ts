import app from "./app";

const port: number = 8888;
app.listen(port, () => {
  console.log(`Server running on port ${port}.`);
});
