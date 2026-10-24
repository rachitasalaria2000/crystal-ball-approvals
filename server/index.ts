import "dotenv/config";
import next from "next";
import { createApi } from "./api";
async function main() {
  const dev = process.env.NODE_ENV !== "production";
  const port = Number(process.env.PORT ?? 3000);
  const web = next({ dev, hostname: "localhost", port });
  await web.prepare();
  const app = createApi();
  app.use((req, res) => web.getRequestHandler()(req, res));
  app.listen(port, () =>
    console.log(`Crystal Ball running at http://localhost:${port}`),
  );
}
main().catch(() => {
  console.error(
    "Server startup failed. Check installation and port availability.",
  );
  process.exit(1);
});
