# הוראות התקנה והגדרה של Appwrite עבור מערכת ניהול הזמנות

## שלב 1: יצירת חשבון וטרויקט ב-Appwrite

### 1.1 יצירת חשבון
1. היכנס לאתר [Appwrite Cloud](https://cloud.appwrite.io) או התקן Appwrite על שרת פרטי
2. לחץ על "Sign Up" וצור חשבון חדש
3. אשר את כתובת המייל שלך

### 1.2 יצירת פרויקט חדש
1. לאחר ההתחברות, לחץ על "Create Project"
2. תן שם לפרויקט: "Scandinavian Marine OMS"
3. בחר Region (מומלץ: האזור הקרוב ביותר למשתמשים שלך)
4. לחץ על "Create"

### 1.3 הגדרת פלטפורמה (Web App)
1. בתפריט הצד, לחץ על "Overview"
2. גלול למטה ל-"Integrate with your platform"
3. בחר "Web App"
4. הזן שם: "Scandinavian Marine OMS Web"
5. הזן Hostname:
   - לפיתוח מקומי: `localhost`
   - לייצור: הדומיין שלך (למשל: `scandinavianmarine.com`)
6. לחץ על "Next"

### 1.4 שמור את פרטי הפרויקט
**שמור את המידע הבא - תצטרך להעביר אותו אליי:**
- **Project ID** (נמצא ב-Settings > General)
- **API Endpoint** (בדרך כלל: `https://cloud.appwrite.io/v1`)

---

## שלב 2: הגדרת Authentication (אימות משתמשים)

### 2.1 הפעלת Email/Password Authentication
1. בתפריט הצד, לחץ על "Auth"
2. לחץ על "Settings" (בטאב העליון)
3. גלול ל-"Auth Methods"
4. ודא ש-"Email/Password" מופעל (enabled)
5. ניתן להשבית את "Email Verification" אם אתה רוצה שמשתמשים יוכלו להתחבר מיד ללא אימות מייל

### 2.2 הגדרת Session Length (אופציונלי)
1. באותו מסך Settings
2. תחת "Security" תוכל להגדיר את משך תוקף ה-Session
3. מומלץ: השאר את ברירת המחדל (1 שנה)

---

## שלב 3: יצירת Database ו-Collections

### 3.1 יצירת Database
1. בתפריט הצד, לחץ על "Databases"
2. לחץ על "Create Database"
3. תן שם: `main_database`
4. לחץ על "Create"

### 3.2 יצירת Collection: `profiles`
1. בתוך ה-Database שיצרת, לחץ על "Create Collection"
2. תן שם: `profiles`
3. לחץ על "Create"

#### 3.2.1 הוספת Attributes ל-Collection `profiles`
לחץ על "Attributes" ולאחר מכן "Create Attribute" עבור כל שדה:

**שדה 1: username**
- Type: `String`
- Size: `255`
- Required: ✓ (סמן)
- Array: לא
- Default value: השאר ריק

**שדה 2: role**
- Type: `Enum`
- Elements: הוסף 3 ערכים:
  - `Admin`
  - `Supplier`
  - `Customer`
- Required: ✓ (סמן)
- Array: לא
- Default value: `Customer`

**שדה 3: userId** (קישור למשתמש ב-Auth)
- Type: `String`
- Size: `255`
- Required: ✓ (סמן)
- Array: לא
- Default value: השאר ריק

### 3.3 הגדרת Indexes (אינדקסים) - חשוב לביצועים
1. בתוך Collection `profiles`, לחץ על טאב "Indexes"
2. לחץ על "Create Index"
3. יצור אינדקס:
   - Index Key: `userId_unique`
   - Type: `Unique`
   - Attributes: בחר `userId`
   - Order: `ASC`

---

## שלב 4: הגדרת Permissions (הרשאות)

### 4.1 הרשאות ל-Collection `profiles`

1. בתוך Collection `profiles`, לחץ על טאב "Settings"
2. גלול ל-"Permissions"

#### הוסף את ההרשאות הבאות:

**הרשאה 1: Admin יכול לקרוא הכל**
- Role: `label` -> הקלד `admin` (תיצור תווית מותאמת אישית)
- Permissions: סמן `Read`

**הרשאה 2: Admin יכול ליצור**
- Role: `label` -> הקלד `admin`
- Permissions: סמן `Create`

**הרשאה 3: Admin יכול לעדכן**
- Role: `label` -> הקלד `admin`
- Permissions: סמן `Update`

**הרשאה 4: Admin יכול למחוק**
- Role: `label` -> הקלד `admin`
- Permissions: סמן `Delete`

**הרשאה 5: משתמש יכול לקרוא את הפרופיל שלו**
- Role: `Users`
- Permissions: סמן `Read`

**הרשאה 6: משתמש יכול לעדכן את הפרופיל שלו**
- Role: `Users`
- Permissions: סמן `Update`

### 4.2 הערה חשובה על Labels
כדי לסמן משתמש כ-Admin, נצטרך להשתמש ב-Appwrite Console או ב-Server SDK.
נטפל בזה בשלב התכנות.

---

## שלב 5: יצירת API Key (למטרות ניהול)

### 5.1 יצירת Server API Key
1. בתפריט הצד, לחץ על "Overview"
2. בפינה הימנית העליונה, לחץ על אייקון ההגדרות (⚙️)
3. בחר "API Keys"
4. לחץ על "Create API Key"
5. תן שם: `Server Key - User Management`
6. תחת "Scopes", בחר את ההרשאות הבאות:
   - `users.read`
   - `users.write`
   - `teams.read`
   - `teams.write`
7. תחת "Expiration", בחר `Never` (אף פעם לא יפוג)
8. לחץ על "Create"

**⚠️ חשוב מאוד: שמור את ה-API Key - הוא יוצג רק פעם אחת!**

---

## שלב 6: יצירת Functions (אופציונלי - לניהול משתמשים מתקדם)

בשלב זה, אם תרצה פונקציונליות מתקדמת כמו יצירת משתמשים עם roles מיוחדים, נוכל ליצור Appwrite Functions.
זה יהיה שלב מתקדם שנוכל לטפל בו יחד לאחר ההתקנה הבסיסית.

---

## שלב 7: מידע שאתה צריך לספק לי

לאחר שהשלמת את כל השלבים לעיל, העבר אליי את המידע הבא:

### 7.1 פרטי חיבור בסיסיים
```
Project ID: [הדבק כאן]
API Endpoint: [הדבק כאן - בדרך כלל: https://cloud.appwrite.io/v1]
```

### 7.2 מזהי Database ו-Collections
```
Database ID: [6910f1320021a4469a93]
Collection ID (profiles): [profiles]
```

### 7.3 API Key (לשרת בלבד - אל תשתף בפומבי!)
```
Server API Key: [standard_4f75c4aa069206a9f03d2257ec15f2979c623d39dcafddf681961d3f63e72a054a401c6e86adda5d4be00a185bfab5c3a4689b6a75e5d4fa1c4777ebf01eba405e0a249b0796559fc8ee6aeb67cb60de801a3a6761e04d32663f7377ffc962a61da115f0749617f28b1a5b448507ed46f388da37cca2cf77240f15883e8222b4]
```

### 7.4 העתק את כל המידע בפורמט הבא:
```
VITE_APPWRITE_PROJECT_ID = "6910e6a5003af03cec58"
VITE_APPWRITE_PROJECT_NAME = "Scandinavian-Marine-OMS"
VITE_APPWRITE_ENDPOINT = "https://fra.cloud.appwrite.io/v1"
APPWRITE_DATABASE_ID=6910f1320021a4469a93
APPWRITE_PROFILES_COLLECTION_ID=profiles
APPWRITE_API_KEY=standard_4f75c4aa069206a9f03d2257ec15f2979c623d39dcafddf681961d3f63e72a054a401c6e86adda5d4be00a185bfab5c3a4689b6a75e5d4fa1c4777ebf01eba405e0a249b0796559fc8ee6aeb67cb60de801a3a6761e04d32663f7377ffc962a61da115f0749617f28b1a5b448507ed46f388da37cca2cf77240f15883e8222b4
```

---

## שלב 8: יצירת משתמש Admin ראשון (נעשה יחד)

לאחר שנשלב את Appwrite באפליקציה, נצטרך ליצור את משתמש ה-Admin הראשון.
זה יעשה באחת משתי הדרכים:

### אפשרות 1: דרך Appwrite Console (ידני)
1. היכנס ל-Appwrite Console
2. לך ל-Auth > Users
3. לחץ על "Create User"
4. מלא פרטים והקצה Labels: `admin`

### אפשרות 2: דרך קוד (נעשה יחד)
אכתוב סקריפט פשוט שיצור את המשתמש הראשון עם הרשאות Admin.

---

## שלב 9: בדיקה ראשונית

לפני שנתחיל לשלב את הקוד:

1. ודא שיצרת את ה-Database בהצלחה
2. ודא שיש Collection בשם `profiles` עם כל ה-Attributes
3. ודא שההרשאות מוגדרות כראוי
4. ודא ששמרת את כל המזהים וה-API Keys

---

## שלב 10: פריסת Appwrite Function לניהול משתמשים

### 10.1 מהי Appwrite Function?
Appwrite Function היא פונקציה שרת-צד (serverless) שרצה בסביבת Appwrite.
היא נדרשת כדי לבצע פעולות מנהליות כמו:
- יצירת משתמשים חדשים
- מחיקת משתמשים
- קבלת רשימת משתמשים עם מיילים (מידע שלא זמין מה-client)

### 10.2 יצירת Function ב-Appwrite Console

1. **היכנס ל-Appwrite Console**
2. **לחץ על "Functions" בתפריט הצד**
3. **לחץ על "Create Function"**
4. **הגדרות Function:**
   - **Name**: `User Management`
   - **Function ID**: `user-management` (חשוב! זה המזהה בקוד)
   - **Runtime**: בחר `Node.js 21.0`
   - **Execute Access**: בחר `Users` (כל משתמש מחובר יכול להפעיל)
   - **Events**: השאר ריק
   - **Schedule**: השאר ריק
   - **Timeout**: 15 (ברירת מחדל)

5. **לחץ על "Create"**

### 10.3 הגדרת Environment Variables ל-Function

לאחר יצירת ה-Function:

1. **לחץ על "Settings" בתפריט העליון**
2. **גלול ל-"Environment Variables"**
3. **הוסף את המשתנים הבאים:**

```
APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1
APPWRITE_DATABASE_ID=6910f1320021a4469a93
APPWRITE_PROFILES_COLLECTION_ID=profiles
APPWRITE_API_KEY=standard_4f75c4aa069206a9f03d2257ec15f2979c623d39dcafddf681961d3f63e72a054a401c6e86adda5d4be00a185bfab5c3a4689b6a75e5d4fa1c4777ebf01eba405e0a249b0796559fc8ee6aeb67cb60de801a3a6761e04d32663f7377ffc962a61da115f0749617f28b1a5b448507ed46f388da37cca2cf77240f15883e8222b4
```

**הערה חשובה:** `APPWRITE_FUNCTION_PROJECT_ID` מוגדר אוטומטית על ידי Appwrite, אין צורך להוסיף אותו.

### 10.4 העלאת הקוד ל-Function

#### שיטה 1: דרך Console (מומלץ לפריסה ראשונה)

1. **לחץ על "Code" בתפריט העליון**
2. **לחץ על "Manual Deployment"**
3. **צור קובץ חדש: `index.js`**
4. **העתק את התוכן של הקובץ:**
   `appwrite-functions/user-management/index.js`
5. **צור קובץ נוסף: `package.json`**
6. **העתק את התוכן של הקובץ:**
   `appwrite-functions/user-management/package.json`
7. **לחץ על "Deploy"**
8. **המתן עד שהסטטוס יהפוך ל-"Ready"**

#### שיטה 2: דרך Appwrite CLI (מתקדם)

אם יש לך את ה-CLI מותקן:

```bash
cd appwrite-functions/user-management
appwrite functions createDeployment \
  --functionId user-management \
  --code . \
  --activate true
```

### 10.5 בדיקת Function

1. **לחץ על "Execute" בתפריט העליון**
2. **ב-"Body", הזן:**
```json
{
  "action": "list"
}
```
3. **לחץ על "Execute"**
4. **בדוק שהתגובה מוצלחת** (צריכה להחזיר רשימת משתמשים ריקה או עם המשתמשים הקיימים)

---

## שלב 11: יצירת משתמש Admin ראשון

כעת, אחרי שה-Function פועלת, נוכל ליצור את משתמש ה-Admin הראשון.

### שיטה 1: דרך Appwrite Console (מומלץ)

1. **היכנס ל-Appwrite Console**
2. **לך ל-Auth > Users**
3. **לחץ על "Create User"**
4. **מלא את הפרטים:**
   - **Email**: המייל שלך
   - **Password**: סיסמה חזקה
   - **Name**: השם שלך
5. **לחץ על "Create"**
6. **שמור את ה-User ID שנוצר**
7. **לך ל-Databases > main_database > profiles**
8. **לחץ על "Create Document"**
9. **מלא את הפרטים:**
   - **Document ID**: השתמש באותו User ID מלמעלה
   - **userId**: אותו User ID
   - **username**: השם המוצג שלך
   - **role**: `Admin`
10. **לחץ על "Create"**

### שיטה 2: דרך ה-Function

1. **לך ל-Functions > user-management > Execute**
2. **ב-"Body", הזן:**
```json
{
  "action": "create",
  "userData": {
    "email": "your-email@example.com",
    "password": "YourStrongPassword123!",
    "username": "Your Name",
    "role": "Admin"
  }
}
```
3. **לחץ על "Execute"**
4. **בדוק שהמשתמש נוצר בהצלחה**

---

## שלב 12: הרצת האפליקציה

כעת הכל מוכן! בוא נריץ את האפליקציה:

1. **פתח טרמינל בתיקיית הפרויקט**
2. **הרץ:**
```bash
npm run dev
```
3. **פתח דפדפן וגש ל:**
```
http://localhost:5173
```
4. **התחבר עם המשתמש Admin שיצרת**
5. **נסה ליצור משתמש חדש דרך הממשק**

---

## שלב 13: פתרון בעיות נפוצות

### בעיה 1: "Failed to fetch users"
**פתרון:**
- ודא שה-Function ID בקוד הוא בדיוק `user-management`
- בדוק שה-Function פעילה ובסטטוס "Ready"
- בדוק שהגדרת את כל Environment Variables

### בעיה 2: "User creation not yet configured"
**פתרון:**
- ודא שפרסת את ה-Function
- בדוק שה-Function ID נכון
- נסה להריץ Execute ידנית דרך Console

### בעיה 3: "Invalid credentials"
**פתרון:**
- ודא שהמייל והסיסמה נכונים
- ודא שיצרת את Profile ב-Database
- ודא שה-role בפרופיל תואם למה שבחרת בכניסה

### בעיה 4: הפונקציה נכשלת עם שגיאת הרשאות
**פתרון:**
- ודא שהעברת את ה-API Key הנכון
- ודא שה-API Key כולל את ההרשאות הנדרשות (users.read, users.write, teams.read, teams.write)

---

## עזרה ותמיכה

אם נתקלת בבעיות בשלב כלשהו:
1. תעשה צילום מסך של השגיאה
2. תספר לי בדיוק באיזה שלב אתה נמצא
3. נפתור את זה יחד!

## משאבים נוספים

- [Appwrite Documentation](https://appwrite.io/docs)
- [Appwrite Web SDK](https://appwrite.io/docs/sdks#web)
- [Appwrite Discord Community](https://appwrite.io/discord)

---

**בהצלחה! 🚀**
