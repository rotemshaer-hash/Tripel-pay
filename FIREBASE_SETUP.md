# חיבור Triple Pay לפרויקט Firebase אמיתי

**קישור:** https://console.firebase.google.com

---

## שלב 1 — יצירת הפרויקט

1. היכנס ל-https://console.firebase.google.com עם חשבון Google שלך
2. **Add project** → תן שם (למשל `triplepay-prod` או `triplepay-live`) — **לא** `kidemy-83a17`, זה הפרויקט של Drushe ואסור לגעת בו
3. אפשר לכבות Google Analytics בשלב הזה (לא נדרש)
4. לחץ **Create project** וחכה שיסיים

## שלב 2 — הוספת אפליקציית Web כדי לקבל את פרטי החיבור

1. במסך הראשי של הפרויקט, לחץ על סמל ה-**Web** (`</>`)
2. תן כינוי לאפליקציה (למשל "Triple Pay Web") — **לא** צריך לסמן Firebase Hosting
3. לחץ **Register app**
4. יופיע בלוק קוד עם `firebaseConfig = {...}` — **תעתיק את כל הבלוק הזה, נצטרך אותו בשלב 5**

## שלב 3 — הפעלת Authentication

1. בתפריט הצד: **Build → Authentication**
2. לחץ **Get started**
3. בלשונית **Sign-in method**, בחר **Email/Password** → הפעל (Enable) → שמור

## שלב 4 — הפעלת Realtime Database

1. בתפריט הצד: **Build → Realtime Database**
2. לחץ **Create Database**
3. בחר מיקום (Region) — כל אזור סביר, למשל `europe-west1`
4. בשלב "Security rules" בחר **Start in locked mode** (זה בסדר — אנחנו נדחוף את הכללים שלנו בעצמנו בשלב 6)
5. אחרי היצירה, **תעתיק את ה-URL שמופיע למעלה** (נראה כמו `https://triplepay-prod-default-rtdb.europe-west1.firebasedatabase.app` או `https://triplepay-prod-default-rtdb.firebaseio.com`)

## שלב 5 — עדכון פרטי החיבור בקוד

פתח את הקובץ `/home/user/triple-pay/.env.local` ועדכן לפי מה שהעתקת בשלבים 2+4:

```
VITE_FIREBASE_API_KEY=<apiKey מהבלוק בשלב 2>
VITE_FIREBASE_AUTH_DOMAIN=<authDomain מהבלוק בשלב 2>
VITE_FIREBASE_DATABASE_URL=<ה-URL שהעתקת בשלב 4>
VITE_FIREBASE_PROJECT_ID=<projectId מהבלוק בשלב 2>
VITE_FIREBASE_STORAGE_BUCKET=<storageBucket מהבלוק בשלב 2>
VITE_USE_FIREBASE_EMULATOR=false
```

חשוב: השורה האחרונה חייבת לעבור ל-`false` כדי שהאפליקציה תדבר עם הפרויקט האמיתי במקום עם האמולטור המקומי.

## שלב 6 — עדכון .firebaserc ופריסת כללי האבטחה

1. פתח את `/home/user/triple-pay/.firebaserc` ועדכן את ה-project ID:
   ```json
   { "projects": { "default": "<ה-project ID האמיתי שלך>" } }
   ```
2. פריסת הכללים (חד-פעמי, מהמחשב שלך עם ה-CLI האמיתי של Firebase, לא מהסביבה הזו):
   ```
   npm install -g firebase-tools
   firebase login
   firebase deploy --only database
   ```

## שלב 7 (אופציונלי) — פריסה אוטומטית דרך GitHub Actions

כבר בניתי את קבצי ה-workflow (`.github/workflows/deploy.yml` ו-`deploy-firebase-rules.yml`), בדיוק כמו ב-Drushe. כדי שירוצו צריך להוסיף ב-GitHub → Settings → Secrets:
- `NETLIFY_AUTH_TOKEN`, `NETLIFY_SITE_ID` — מ-Netlify (אתר נפרד מ-Drushe)
- `FIREBASE_SERVICE_ACCOUNT` — JSON של Service Account: ב-Firebase Console → ⚙️ Project settings → Service accounts → **Generate new private key**, להדביק את כל תוכן הקובץ שיורד כ-secret אחד

## שלב 8 — בדיקה

הרץ מקומית:
```
npm run dev
```
ותעבור את זרימת ההרשמה המלאה. אם הכל תקין, תראה את הנתונים מופיעים ב-Firebase Console תחת Realtime Database → `families/<uid>`.

---

**זהירות:** אל תעדכן בטעות את `.firebaserc` או `.env.local` של הריפו הזה עם ערכים שמפנים ל-`kidemy-83a17` — זה יגרום לערבוב בין הפרויקטים, בדיוק מה שהתבקשתי במפורש לא לעשות.
