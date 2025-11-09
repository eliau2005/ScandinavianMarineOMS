# פתרון בעיות התחברות - Troubleshooting Login Issues

## בעיה: לא מצליח להתחבר למשתמש

### שלב 1: ודא שיצרת משתמש ב-Appwrite

לפני שתוכל להתחבר, **חייב** להיות לך משתמש שנוצר ב-Appwrite. יש שתי דרכים ליצור משתמש:

#### אפשרות 1: יצירה דרך Appwrite Console (מומלץ למשתמש הראשון)

1. **היכנס ל-Appwrite Console**: https://cloud.appwrite.io
2. **בחר את הפרויקט שלך**: `Scandinavian-Marine-OMS`
3. **לך ל-Auth > Users**
4. **לחץ על "Create User"**
5. **מלא את הפרטים:**
   ```
   Email: your-email@example.com
   Password: YourPassword123!
   Name: Your Name
   ```
6. **לחץ על "Create"**
7. **❗ חשוב מאוד: שמור את ה-User ID שנוצר** (משהו כמו: `6547abc123def456`)

---

### שלב 2: צור Profile למשתמש ב-Database

**זה השלב הכי קריטי!** אם אין Profile, ההתחברות תיכשל.

1. **היכנס ל-Appwrite Console**
2. **לך ל-Databases > main_database > profiles**
3. **לחץ על "Create Document"**
4. **מלא את הפרטים:**
   ```
   Document ID: [הדבק כאן את ה-User ID מהשלב הקודם - אותו ID בדיוק!]
   userId: [שוב, אותו User ID]
   username: Your Display Name
   role: Admin (או Supplier/Customer)
   ```
5. **לחץ על "Create"**

---

### שלב 3: נסה להתחבר

כעת נסה להתחבר באפליקציה:

1. **פתח את האפליקציה**: http://localhost:3001
2. **בחר את סוג המשתמש הנכון** (Admin/Supplier/Customer) - חייב להתאים ל-role שהגדרת!
3. **הזן את המייל והסיסמה**
4. **לחץ על Login**

---

## שגיאות נפוצות ופתרונות

### ❌ שגיאה: "Invalid email or password"

**סיבות אפשריות:**
- הסיסמה או המייל שגויים
- המשתמש לא קיים ב-Auth

**פתרון:**
1. בדוק שהמייל והסיסמה נכונים (שים לב לאותיות גדולות/קטנות)
2. היכנס ל-Appwrite Console > Auth > Users
3. ודא שהמשתמש קיים עם המייל שהזנת
4. אם המשתמש לא קיים, צור אותו (שלב 1 למעלה)

---

### ❌ שגיאה: "User not found. Please check your credentials."

**סיבה:**
- המשתמש קיים ב-Auth אבל **אין לו Profile בדאטהבייס**

**פתרון:**
1. היכנס ל-Appwrite Console > Databases > main_database > profiles
2. בדוק אם יש Document עם ה-ID של המשתמש שלך
3. אם לא, צור Profile חדש (שלב 2 למעלה)
4. ❗ **חשוב:** ה-Document ID חייב להיות **זהה** ל-User ID מ-Auth!

---

### ❌ שגיאה: "Access denied. Please use the [Role] login portal."

**סיבה:**
- בחרת סוג משתמש (Admin/Supplier/Customer) שלא תואם ל-role בפרופיל

**פתרון:**
1. היכנס ל-Appwrite Console > Databases > main_database > profiles
2. מצא את הפרופיל שלך
3. בדוק מה ה-role שלו (Admin/Supplier/Customer)
4. באפליקציה, בחר את אותו role בדיוק
5. אלטרנטיבה: שנה את ה-role בפרופיל להתאים למה שאתה רוצה

---

### ❌ האפליקציה תקועה על מסך טעינה

**סיבות אפשריות:**
- בעיית חיבור ל-Appwrite
- פרטי החיבור (Project ID, Endpoint) שגויים

**פתרון:**
1. פתח את ה-Developer Tools בדפדפן (F12)
2. לך ל-Console
3. חפש שגיאות אדומות
4. אם יש שגיאה עם "Failed to fetch" או "Network error":
   - בדוק את קובץ `.env`
   - ודא שה-`VITE_APPWRITE_ENDPOINT` נכון: `https://fra.cloud.appwrite.io/v1`
   - ודא שה-`VITE_APPWRITE_PROJECT_ID` נכון: `6910e6a5003af03cec58`

---

## בדיקה מהירה: האם המשתמש שלי מוגדר נכון?

השתמש בצ'קליסט הזה:

### ✅ בדיקת Auth
- [ ] המשתמש קיים ב-Appwrite Console > Auth > Users
- [ ] המייל נכון
- [ ] הסיסמה נכונה (נסה לאפס אם לא בטוח)

### ✅ בדיקת Profile
- [ ] יש Document ב-Databases > main_database > profiles
- [ ] ה-Document ID **זהה** ל-User ID מ-Auth
- [ ] השדה `userId` **זהה** ל-User ID מ-Auth
- [ ] השדה `username` מוגדר
- [ ] השדה `role` הוא אחד מהערכים: Admin / Supplier / Customer

### ✅ בדיקת התחברות
- [ ] בחרתי את אותו `role` באפליקציה כמו שמוגדר בפרופיל
- [ ] הזנתי את המייל והסיסמה הנכונים

---

## עדיין לא עובד? עשה את זה:

### צור משתמש Admin חדש מאפס:

1. **Auth - יצירת משתמש:**
   ```
   Email: admin@test.com
   Password: Admin123!
   Name: Test Admin
   ```
   לאחר היצירה, שמור את ה-User ID (לדוגמה: `65f4a1b2c3d4e5f6g7h8`)

2. **Database - יצירת Profile:**
   ```
   Document ID: 65f4a1b2c3d4e5f6g7h8  (אותו ID מהשלב הקודם!)
   userId: 65f4a1b2c3d4e5f6g7h8       (אותו ID!)
   username: Test Admin
   role: Admin
   ```

3. **התחבר באפליקציה:**
   ```
   User Type: Admin
   Email: admin@test.com
   Password: Admin123!
   ```

---

## עזרה נוספת

אם עדיין יש בעיה:

1. **פתח Developer Tools (F12) בדפדפן**
2. **לך ל-Console**
3. **צלם מסך של השגיאות**
4. **שלח לי את:**
   - צילום המסך
   - מה בדיוק קורה (מה אתה רואה על המסך)
   - מה המייל שאתה מנסה להתחבר איתו
   - מה ה-role שבחרת

אני אעזור לך לפתור את זה! 🚀
