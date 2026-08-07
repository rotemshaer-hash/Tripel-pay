import { chromium } from "playwright";

const shots = "/tmp/claude-0/-home-user-Telegram-rs/4f8aa2eb-e0e2-5755-84ac-b0e801e09c28/scratchpad";

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const page = await browser.newPage({ viewport: { width: 430, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
page.on("console", (msg) => { if (msg.type() === "error") errors.push(`console: ${msg.text()}`); });

async function shot(name) {
  await page.waitForTimeout(250);
  await page.screenshot({ path: `${shots}/${name}.png` });
}

await page.goto("http://localhost:5173/");
await shot("01-splash");

await page.waitForURL("**/onboarding/welcome", { timeout: 3000 });
await shot("02-welcome");
await page.getByText("המשך").click();
await shot("03-welcome-2");
await page.getByText("המשך").click();
await shot("03b-welcome-3");
await page.getByText("בואו נתחיל").click();

const uniquePhone = "050" + Math.floor(1000000 + Math.random() * 8999999);

await page.waitForURL("**/onboarding/phone");
await page.getByPlaceholder("05X-XXXXXXX").fill(uniquePhone);
await page.getByText("שליחת קוד").click();
await shot("04-otp-phone-filled");

await page.waitForURL("**/onboarding/code");
const codeInputs = page.locator("input");
for (let i = 0; i < 4; i++) await codeInputs.nth(i).fill(String(i + 1));
await shot("05-otp-code");
await page.getByText("אימות").click();

await page.waitForURL("**/onboarding/details");
await page.getByPlaceholder("פלוני אלמוני").fill("דנה");
await page.getByPlaceholder("לפחות 6 תווים").fill("test123456");
await page.getByText("הבא").click();

await page.waitForURL("**/onboarding/children");
await shot("06-children-details");
await page.getByRole("button", { name: "שליחה" }).click();

await page.waitForURL("**/onboarding/success", { timeout: 3000 });
await shot("07-success");
await page.getByRole("button", { name: "סיימתי" }).click();

// real Firebase Auth registration + RTDB round-trip now happens here
await page.waitForURL("**/parent", { timeout: 15000 });
await shot("08-parent-home");

await page.locator('nav a[href$="/parent/child-tasks"]').click();
await page.waitForURL("**/parent/child-tasks");
await shot("09-parent-child-tasks");

const approveBtn = page.getByText("אישור").first();
if (await approveBtn.count()) {
  await approveBtn.click();
  await shot("10-after-approve");
}

await page.locator('nav a[href$="/parent/gift-bank"]').click();
await page.waitForURL("**/parent/gift-bank");
await shot("11-gift-bank");

await page.locator('nav a[href$="/parent/child-hub"]').click();
await page.waitForURL("**/parent/child-hub");
await shot("11b-child-hub");

await page.locator('nav a[href$="/parent/child-hub"]').click();
await page.getByText("הגדרות").click();
await page.waitForURL("**/parent/settings");
await shot("12-settings");

await page.goBack();
await page.waitForURL("**/parent/child-hub");
await page.getByText("חסכונות").click();
await page.waitForURL("**/parent/savings");
await shot("12b-savings");

await page.goBack();
await page.waitForURL("**/parent/child-hub");
await page.getByText("תנועות").click();
await page.waitForURL("**/parent/transactions");
await shot("12c-transactions");

// switch to child view via demo pill
await page.getByText("🧒 ילד").click();
await page.waitForURL("**/child");
await shot("13-child-home");

await page.locator('nav a[href$="/child/courses"]').click();
await page.waitForURL("**/child/courses");
await shot("14-child-courses");

await page.locator('nav a[href$="/child/achievements"]').click();
await page.waitForURL("**/child/achievements");
await shot("15-child-achievements");

await browser.close();

if (errors.length) {
  console.log("ERRORS:\n" + errors.join("\n"));
  process.exit(1);
} else {
  console.log("OK - no console/page errors across full flow");
}
