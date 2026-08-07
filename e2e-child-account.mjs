import { chromium } from "playwright";

const shots = "/tmp/claude-0/-home-user-Telegram-rs/4f8aa2eb-e0e2-5755-84ac-b0e801e09c28/scratchpad/e2e";
import { mkdirSync } from "fs";
mkdirSync(shots, { recursive: true });

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });

const errors = [];
function trackErrors(page, label) {
  page.on("pageerror", (e) => errors.push(`${label} pageerror: ${e.message}`));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(`${label} console: ${msg.text()}`);
  });
}

// ---- Parent context: register, seed 2 children by name, grab the invite code ----
const parentCtx = await browser.newContext({ viewport: { width: 430, height: 900 } });
const parentPage = await parentCtx.newPage();
trackErrors(parentPage, "parent");

await parentPage.goto("http://localhost:5173/");
await parentPage.waitForURL("**/onboarding/splash", { timeout: 3000 });
await parentPage.getByText("הצטרפות עכשיו").click();

await parentPage.waitForURL("**/onboarding/welcome");
await parentPage.getByText("המשך").click();
await parentPage.getByText("המשך").click();
await parentPage.getByText("בואו נתחיל").click();

await parentPage.waitForURL("**/onboarding/details");
const parentEmail = `dana.e2e.${Date.now()}@example.com`;
await parentPage.getByPlaceholder("פלוני אלמוני").fill("דנה E2E");
await parentPage.getByPlaceholder("name@example.com").fill(parentEmail);
await parentPage.getByPlaceholder("לפחות 6 תווים").fill("parentpass1");
await parentPage.getByText("הבא").click();

await parentPage.waitForURL("**/onboarding/children");
const childName = "טסט" + Math.floor(Math.random() * 1000);
await parentPage.locator('input[type="text"], input:not([type])').first().fill(childName);
await parentPage.locator("input").nth(1).fill("נועה E2E");
await parentPage.screenshot({ path: `${shots}/01-children-details.png` });
await parentPage.getByRole("button", { name: "שליחה" }).click();

await parentPage.waitForURL("**/onboarding/success", { timeout: 3000 });
await parentPage.getByRole("button", { name: "סיימתי" }).click();
await parentPage.waitForURL("**/parent", { timeout: 15000 });
await parentPage.screenshot({ path: `${shots}/02-parent-home.png` });

// go to child hub, switch to the first child (should be active by default), read invite code
await parentPage.goto("http://localhost:5173/#/parent/child-hub");
await parentPage.waitForTimeout(500);
await parentPage.screenshot({ path: `${shots}/03-child-hub-invite.png` });

const codeText = await parentPage.locator("div[dir='ltr']").filter({ hasText: /^[A-Z0-9]{6}$/ }).first().textContent();
console.log("INVITE CODE CAPTURED:", codeText);
if (!codeText) throw new Error("Could not find invite code on ChildHub screen");
const inviteCode = codeText.trim();

// ---- Child context: fresh browser context (separate storage), redeem the code ----
const childCtx = await browser.newContext({ viewport: { width: 430, height: 900 } });
const childPage = await childCtx.newPage();
trackErrors(childPage, "child");

await childPage.goto(`http://localhost:5173/#/child-register?code=${inviteCode}`);
await childPage.waitForTimeout(500);
await childPage.screenshot({ path: `${shots}/04-child-register-prefilled.png` });
const childUsername = "testkid" + Math.floor(Math.random() * 10000);
const childPassword = "childpass1";
await childPage.locator("input").nth(1).fill(childUsername);
await childPage.locator("input").nth(2).fill(childPassword);
await childPage.getByRole("button", { name: "יצירת חשבון" }).click();

await childPage.waitForURL("**/child", { timeout: 15000 });
await childPage.screenshot({ path: `${shots}/05-child-home-after-register.png` });

const childHeaderText = await childPage.locator("header").first().textContent();
console.log("CHILD HOME HEADER:", childHeaderText);
if (!childHeaderText?.includes(childName)) {
  errors.push(`Child session shows wrong name in header: expected "${childName}", got "${childHeaderText}"`);
}

// verify the role-switcher pill is gone for a real child session
const switcherCount = await childPage.locator(".role-switcher").count();
if (switcherCount !== 0) errors.push(`Expected no .role-switcher for a real child session, found ${switcherCount}`);

// ---- Real security check: not just the UI, the rules themselves ----
// Sign in as the child directly against the Auth emulator's REST API to get a real ID
// token, then hit the Database emulator's REST API with it — this proves the security
// rules block cross-scope writes even if someone bypassed the app UI entirely (e.g.
// via devtools), not just that the React router redirected them.
const childEmail = `child-${childUsername.toLowerCase().replace(/[^a-z0-9_.-]/g, "")}@triplepay.app`;
const signInRes = await fetch("http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=fake-api-key", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: childEmail, password: childPassword, returnSecureToken: true }),
});
const signInBody = await signInRes.json();
const childIdToken = signInBody.idToken;
const childAuthUid = signInBody.localId;
if (!childIdToken) errors.push(`Could not sign in as child via REST to get an ID token: ${JSON.stringify(signInBody)}`);

if (childIdToken) {
  // Look up which family/child this auth uid is linked to (the same lookup the app
  // itself does), using the child's own real token — proves childLogins read access.
  const linkRes = await fetch(`http://127.0.0.1:9000/childLogins/${childAuthUid}.json?ns=demo-triplepay&auth=${childIdToken}`);
  const link = await linkRes.json();
  console.log("CHILD LINK:", JSON.stringify(link));
  if (!link || !link.familyUid || !link.childId) errors.push(`childLogins lookup failed for the newly registered child: ${JSON.stringify(link)}`);

  if (link && link.familyUid && link.childId) {
    // (a) legitimate write to the child's OWN subtree must succeed
    const ownWriteRes = await fetch(`http://127.0.0.1:9000/families/${link.familyUid}/children/${link.childId}/balance.json?ns=demo-triplepay&auth=${childIdToken}`, {
      method: "PUT",
      body: "9999",
    });
    const ownWriteBody = await ownWriteRes.json();
    if (ownWriteBody && ownWriteBody.error) errors.push(`Child could not write to their OWN balance (should be allowed): ${JSON.stringify(ownWriteBody)}`);

    // (b) writing to the shared taskBank (parent-only territory) must be denied
    const taskBankRes = await fetch(`http://127.0.0.1:9000/families/${link.familyUid}/taskBank.json?ns=demo-triplepay&auth=${childIdToken}`, {
      method: "PUT",
      body: "[]",
    });
    const taskBankBody = await taskBankRes.json();
    if (!(taskBankBody && taskBankBody.error)) errors.push(`Child was able to overwrite taskBank (should be denied): ${JSON.stringify(taskBankBody)}`);
  }
}


// verify the child cannot reach a parent-only route by URL
await childPage.goto("http://localhost:5173/#/parent/settings");
await childPage.waitForTimeout(800);
await childPage.screenshot({ path: `${shots}/06-child-tries-parent-settings.png` });
const urlAfterAttempt = childPage.url();
if (!urlAfterAttempt.includes("/child") || urlAfterAttempt.includes("/parent")) {
  errors.push(`Child was not redirected away from /parent/settings, ended up at: ${urlAfterAttempt}`);
}

// ---- Verify data isolation via direct RTDB REST reads ----
const dbBase = "http://127.0.0.1:9000";
// unauthenticated read of the family must be denied
const unauthRes = await fetch(`${dbBase}/families.json?ns=demo-triplepay`);
const unauthBody = await unauthRes.json();
console.log("UNAUTH FAMILIES READ:", JSON.stringify(unauthBody));
if (unauthBody !== null && !(unauthBody && unauthBody.error)) {
  errors.push(`Unauthenticated read of /families returned data instead of a permission error: ${JSON.stringify(unauthBody)}`);
}

console.log("TOTAL ERRORS:", errors.length);
if (errors.length) console.log(JSON.stringify(errors, null, 2));
await browser.close();
