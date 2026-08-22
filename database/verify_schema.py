"""
Schema and FK Validation Script for Plan My Journey
Validates all 8 tables and foreign key integrity.
"""
import sqlite3
import os
import sys

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

def verify_database_schema():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    sql_file = os.path.join(script_dir, "migrations", "001_initial_schema_sqlite.sql")
    
    print("\n[INFO] Verifying Database Schema & Foreign Key Integrity...\n")
    
    conn = sqlite3.connect(":memory:")
    conn.execute("PRAGMA foreign_keys = ON;")
    
    with open(sql_file, "r", encoding="utf-8") as f:
        sql_content = f.read()
    
    conn.executescript(sql_content)
    
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';")
    tables = {row[0] for row in cursor.fetchall()}
    
    expected_tables = [
        "users",
        "trips",
        "cities",
        "trip_stops",
        "activities",
        "itinerary_activities",
        "expenses",
        "shares"
    ]
    
    missing = []
    for tbl in expected_tables:
        if tbl in tables:
            print(f"  [PASS] Table exists: {tbl}")
        else:
            print(f"  [FAIL] Missing table: {tbl}")
            missing.append(tbl)
            
    if missing:
        print(f"\n[FAIL] Missing tables: {missing}")
        sys.exit(1)
        
    print("\n[INFO] Testing Foreign Key Enforcement & Cascades...")
    
    conn.execute("INSERT INTO users (id, name, email, password_hash) VALUES ('u1', 'Alice', 'alice@example.com', 'hash123')")
    conn.execute("INSERT INTO cities (id, name, country) VALUES ('c1', 'Paris', 'France')")
    conn.execute("INSERT INTO activities (id, city_id, name) VALUES ('a1', 'c1', 'Eiffel Tower Tour')")
    conn.execute("INSERT INTO trips (id, user_id, title) VALUES ('t1', 'u1', 'Euro Trip')")
    conn.execute("INSERT INTO trip_stops (id, trip_id, city_id, city_name, stop_order) VALUES ('s1', 't1', 'c1', 'Paris', 1)")
    conn.execute("INSERT INTO itinerary_activities (id, trip_stop_id, activity_id, title) VALUES ('ia1', 's1', 'a1', 'Morning Eiffel Visit')")
    conn.execute("INSERT INTO expenses (id, trip_id, category, description, amount, paid_by) VALUES ('e1', 't1', 'Sightseeing', 'Eiffel Tickets', 50.00, 'u1')")
    conn.execute("INSERT INTO shares (id, trip_id, share_token) VALUES ('sh1', 't1', 'share-token-abc-123')")
    conn.commit()
    print("  [PASS] Successfully inserted sample records into all 8 tables")
    
    try:
        conn.execute("INSERT INTO trips (id, user_id, title) VALUES ('t2', 'non-existent-user', 'Invalid Trip')")
        print("  [FAIL] ERROR: FK constraint failed to block invalid user_id")
        sys.exit(1)
    except sqlite3.IntegrityError:
        print("  [PASS] Foreign key rejection verified: Invalid user_id blocked")
        
    conn.execute("DELETE FROM users WHERE id='u1'")
    conn.commit()
    
    cursor.execute("SELECT COUNT(*) FROM trips WHERE id='t1'")
    assert cursor.fetchone()[0] == 0
    cursor.execute("SELECT COUNT(*) FROM trip_stops WHERE id='s1'")
    assert cursor.fetchone()[0] == 0
    cursor.execute("SELECT COUNT(*) FROM itinerary_activities WHERE id='ia1'")
    assert cursor.fetchone()[0] == 0
    cursor.execute("SELECT COUNT(*) FROM expenses WHERE id='e1'")
    assert cursor.fetchone()[0] == 0
    cursor.execute("SELECT COUNT(*) FROM shares WHERE id='sh1'")
    assert cursor.fetchone()[0] == 0
    
    print("  [PASS] Cascade deletion verified: Deleting user cleanly cascades across all child records")
    print("\n============================================================")
    print(" Database Verification: All 8 Tables & Constraints Verified!")
    print("============================================================\n")
    conn.close()

if __name__ == "__main__":
    verify_database_schema()
