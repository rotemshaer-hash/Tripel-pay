import { chromium } from "playwright";

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const errors = [];
function trackErrors(page, label) {
  page.on("pageerror", (e) => errors.push(`${label} pageerror: ${e.message}`));
  page.on("console", (msg) => { if (msg.type() === "error") errors.push(`${label} console: ${msg.text()}`); });
}

// ---- Parent A: register the family ----
const aCtx = await browser.newContext({ viewport: { width: 430, height: 900 } });
const a = await aCtx.newPage();
trackErrors(a, "parentA");

await a.goto("http://localhost:5173/");
await a.waitForURL("**/onboarding/splash", { timeout: 3000 });
await a.getByText("הצטרפות עכשיו").click();
await a.waitForURL("**/onboarding/welcome");
await a.getByText("המשך").click();
await a.getByText("המשך").click();
await a.getByText("בואו נתחיל").click();

await a.waitForURL("**/onboarding/details");
const emailA = `parentA.${Date.now()}@example.com`;
await a.getByPlaceholder("פלוני אלמוני").fill("הורה א");
await a.getByPlaceholder("name@example.com").fill(emailA);
await a.getByPlaceholder("לפחות 6 תווים").fill("passwordA1");
await a.getByText("הבא").click();
await a.waitForURL("**/onboarding/children");
await a.getByRole("button", { name: "שליחה" }).click();
await a.waitForURL("**/onboarding/success", { timeout: 3000 });
await a.getByRole("button", { name: "סיימתי" }).click();
await a.waitForURL("**/parent", { timeout: 15000 });

// ---- go to settings, grab the co-parent invite code ----
await a.goto("http://localhost:5173/#/parent/settings");
await a.waitForTimeout(500);
const codeText = await a.locator("div[dir='ltr']").filter({ hasText: /^[A-Z0-9]{6}$/ }).first().textContent();
console.log("PARENT INVITE CODE:", codeText);
if (!codeText) throw new Error("Could not find parent invite code on Settings screen");
const inviteCode = codeText.trim();

// ---- Parent B: fresh context, redeems the code ----
const bCtx = await browser.newContext({ viewport: { width: 430, height: 900 } });
const b = await bCtx.newPage();
trackErrors(b, "parentB");

await b.goto(`http://localhost:5173/#/parent-register?code=${inviteCode}`);
await b.waitForTimeout(500);
const emailB = `parentB.${Date.now()}@example.com`;
await b.getByPlaceholder("פלוני אלמוני").fill("הורה ב");
await b.getByPlaceholder("name@example.com").fill(emailB);
await b.getByPlaceholder("לפחות 6 תווים").fill("passwordB1");
await b.getByRole("button", { name: "יצירת חשבון" }).click();
await b.waitForURL("**/parent", { timeout: 15000 });
await b.waitForTimeout(500);

// verify parent B sees the SAME family data (same child names) as parent A
await b.goto("http://localhost:5173/#/parent/child-hub");
await b.waitForTimeout(500);
const bodyTextB = await b.locator("body").textContent();
console.log("PARENT B CHILD-HUB CONTAINS EXPECTED CHILD:", bodyTextB?.includes("ילד/ה 1"));

// verify parent B has FULL write access: toggle freeze on a child and confirm it persists
await b.goto("http://localhost:5173/#/parent/settings");
await b.waitForTimeout(500);
const freezeToggle = b.getByRole("switch").first();
await freezeToggle.click();
await b.waitForTimeout(800);

// Parent A reloads and should see the freeze that Parent B just set (shared family data)
await a.reload();
await a.waitForTimeout(800);
await a.goto("http://localhost:5173/#/parent/settings");
await a.waitForTimeout(800);
const frozenLabelVisible = await a.getByText("הכרטיס מוקפא").count();
console.log("PARENT A SEES FREEZE SET BY PARENT B:", frozenLabelVisible > 0);
if (frozenLabelVisible === 0) errors.push("Parent A did not see the freeze toggle Parent B set — shared family write did not propagate");

console.log("TOTAL ERRORS:", errors.length);
if (errors.length) console.log(JSON.stringify(errors, null, 2));
await browser.close();
