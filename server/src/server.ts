import { createApp } from "./app";
import { config } from "./config";

const app = createApp();

app.listen(config.port, () => {
  console.log(`===============================================`);
  console.log(`  FixIt AI Backend Service is running!`);
  console.log(`  Port: http://localhost:${config.port}`);
  console.log(`  Health Check: http://localhost:${config.port}/api/v1/health`);
  console.log(`  AI Provider: ${config.aiProvider}`);
  console.log(`===============================================`);
});
