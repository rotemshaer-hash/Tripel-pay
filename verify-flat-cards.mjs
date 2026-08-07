import { chromium } from "playwright";
import { mkdirSync } from "fs";

const shots = "/tmp/claude-0/-home-user-Telegram-rs/4f8aa2eb-e0e2-5755-84ac-b0e801e09c28/scratchpad/flat-shots";
mkdirSync(shots, { recursive: true });

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const page = await browser.newPage({ viewport: { width: 430, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(`console: ${msg.text()}`);
});

async function shot(name) {
  await page.waitForTimeout(250);
  await page.screenshot({ path: `${shots}/${name}.png` });
}

await page.goto("http://localhost:5173/");
await page.waitForURL("**/onboarding/splash", { timeout: 5000 });
await page.getByText("הצטרפות עכשיו").click();
await page.waitForURL("**/onboarding/welcome");
await page.getByText("המשך").click();
await page.getByText("המשך").click();
await page.getByText("בואו נתחיל").click();
await page.waitForURL("**/onboarding/details");
const email = `dana.flat.${Date.now()}@example.com`;
await page.getByPlaceholder("פלוני אלמוני").fill("דנה בדיקה");
await page.getByPlaceholder("name@example.com").fill(email);
await page.getByPlaceholder("לפחות 6 תווים").fill("qapassword1");
await page.getByText("הבא").click();
await page.waitForURL("**/onboarding/children");
await page.getByRole("button", { name: "שליחה" }).click();
await page.waitForURL("**/onboarding/success", { timeout: 5000 });
await page.getByRole("button", { name: "סיימתי" }).click();
await page.waitForURL("**/parent", { timeout: 15000 });
await shot("01-parent-home");

await page.getByText("צפייה בהכל").click().catch(() => {});
await page.goto("http://localhost:5173/#/parent/gift-bank");
await shot("02-gift-bank");

await page.goto("http://localhost:5173/#/parent/transactions");
await shot("03-parent-transactions");

await page.goto("http://localhost:5173/#/parent/child-hub");
await shot("04-child-hub");

await page.goto("http://localhost:5173/#/parent/tasks-bank");
await shot("05-tasks-bank");

await page.goto("http://localhost:5173/#/parent/house-rules");
await shot("06-house-rules");

await page.goto("http://localhost:5173/#/child");
await shot("07-child-home");

await page.goto("http://localhost:5173/#/child/courses");
await shot("08-child-courses");

await page.goto("http://localhost:5173/#/child/transactions");
await shot("09-child-transactions");

// send-money modal (needs solid bg)
await page.goto("http://localhost:5173/#/parent");
await page.waitForTimeout(500);
const fab = page.locator("button:has(svg)").last();
await fab.click().catch(() => {});
await shot("10-send-money-modal");

console.log("=== console/page errors ===", errors);
await browser.close();
