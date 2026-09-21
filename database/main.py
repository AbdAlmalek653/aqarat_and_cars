from pathlib import Path
import sqlite3

# الآن نقرأ من ملف SQL الصافي مباشرة
source = Path("database/schema.sql")
target = Path("database/souq.db")

# قراءة محتوى الملف
sql = source.read_text(encoding="utf-8")

# حذف قاعدة البيانات القديمة إذا كانت موجودة لإنشائها من جديد
target.unlink(missing_ok=True)

# الاتصال بقاعدة البيانات وتنفيذ الكود
connection = sqlite3.connect(target)
connection.execute("PRAGMA foreign_keys = ON")

try:
    connection.executescript(sql)
    connection.commit()
    print("تم إنشاء database/souq.db بنجاح بدون أي أخطاء!")
except sqlite3.OperationalError as e:
    print(f"حدث خطأ في أوامر SQL: {e}")
finally:
    connection.close()