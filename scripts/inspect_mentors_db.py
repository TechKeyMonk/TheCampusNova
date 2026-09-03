import sys, os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
import db
import json

def inspect():
    print("=== POSTGRESQL MENTORS TABLE INSPECTION ===")
    print("PG Connected:", db.is_pg_connected())
    
    # Check constraints
    constraints = db.query_all("""
        SELECT conname, contype, pg_get_constraintdef(c.oid) as def
        FROM pg_constraint c
        JOIN pg_class t ON c.conrelid = t.oid
        WHERE t.relname = 'mentors';
    """)
    print("\nConstraints:")
    for c in constraints:
        print(" ", c)

    # Check columns
    cols = db.query_all("""
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'mentors'
        ORDER BY ordinal_position;
    """)
    print("\nColumns:")
    for col in cols:
        print(" ", col)

    # Check current rows
    rows = db.query_all("SELECT * FROM mentors;")
    print(f"\nTotal Mentors in PG: {len(rows)}")
    for r in rows:
        print(" ", r)

if __name__ == '__main__':
    inspect()
