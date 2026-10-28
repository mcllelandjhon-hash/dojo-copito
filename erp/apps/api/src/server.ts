import { createApp } from "./app.js";
import { env } from "./config/env.js";

const app = createApp();
app.listen(env.PORT, () => {
  console.log(`ERP Copito API escuchando en http://localhost:${env.PORT}`);
  console.log(`Salud: http://localhost:${env.PORT}/health`);
});
