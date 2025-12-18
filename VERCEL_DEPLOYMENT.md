# הוראות פריסה ל-Vercel

## 🚀 הגדרת Environment Variables

כדי שהאפליקציה תעבוד ב-Vercel, צריך להגדיר את משתני הסביבה הבאים:

### שלב 1: כנס להגדרות Vercel

1. היכנס ל-[Vercel Dashboard](https://vercel.com/dashboard)
2. בחר את הפרויקט **comaxtr**
3. לך ל-**Settings** → **Environment Variables**

### שלב 2: הוסף משתני סביבה

הוסף את 2 המשתנים הבאים:

#### VITE_SUPABASE_URL
```
https://cbblwihayjkteqdgjevl.supabase.co
```

#### VITE_SUPABASE_PUBLISHABLE_KEY
```
[המפתח הציבורי שלך מ-Supabase]
```

### שלב 3: למצוא את המפתח הציבורי

1. היכנס ל-[Supabase Dashboard](https://supabase.com/dashboard)
2. בחר את הפרויקט שלך: `cbblwihayjkteqdgjevl`
3. לך ל-**Settings** → **API**
4. העתק את:
   - **Project URL** → זה ה-`VITE_SUPABASE_URL`
   - **anon public key** → זה ה-`VITE_SUPABASE_PUBLISHABLE_KEY`

### שלב 4: Redeploy

אחרי הוספת המשתנים:
1. חזור ל-Vercel Dashboard
2. לך ל-**Deployments**
3. לחץ על **Redeploy** על ה-deployment האחרון
4. או עשה `git push` חדש לגיטהאב

---

## 🔍 בדיקת תקינות

אחרי ה-deployment:
1. פתח את האפליקציה ב-Vercel
2. פתח את **Developer Console** (F12)
3. לך ל-**Console**
4. בדוק שאין שגיאות של Supabase connection

אם הכל עובד, תראה את הנתונים בטבלה.

---

## ⚠️ בעיות נפוצות

### טבלה ריקה
- בדוק שמשתני הסביבה הוגדרו נכון
- בדוק שעשית Redeploy אחרי הוספת המשתנים
- בדוק בקונסול שאין שגיאות חיבור

### שגיאת 401/403
- המפתח הציבורי לא נכון
- בדוק שהעתקת את **anon public** key ולא **service_role** key

### אין חיבור למסד נתונים
- בדוק שה-URL של Supabase נכון
- בדוק שהפרויקט פעיל ב-Supabase

