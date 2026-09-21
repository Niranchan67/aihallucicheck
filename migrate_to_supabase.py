"""
migrate_to_supabase.py
----------------------
One-click migration script to transfer all verification reports,
claims, and citations from your local SQLite database to Supabase PostgreSQL.

Usage:
    py migrate_to_supabase.py "postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres"
Or configure DATABASE_URL in backend/.env and run:
    py migrate_to_supabase.py
"""

import os
import sys
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), "backend", ".env"))

# Import database models
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))
from models import Base, VerificationReport, Claim, Citation

def get_target_url():
    if len(sys.argv) > 1 and sys.argv[1].startswith("postgres"):
        return sys.argv[1]
    env_url = os.getenv("DATABASE_URL")
    if env_url and "postgres" in env_url:
        return env_url
    return None

def main():
    target_url = get_target_url()
    if not target_url:
        print("\n[ERROR] No Supabase PostgreSQL URL provided.")
        print("Please provide your connection string:")
        print("  py migrate_to_supabase.py \"postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres\"")
        print("Or add DATABASE_URL=... in backend/.env\n")
        sys.exit(1)

    # Normalize url scheme
    if target_url.startswith("postgres://"):
        target_url = target_url.replace("postgres://", "postgresql+psycopg2://", 1)
    elif target_url.startswith("postgresql://") and not target_url.startswith("postgresql+psycopg2://"):
        target_url = target_url.replace("postgresql://", "postgresql+psycopg2://", 1)

    sqlite_path = os.path.join(os.path.dirname(__file__), "backend", "hallucicheck.db")
    if not os.path.exists(sqlite_path):
        print(f"[ERROR] SQLite database not found at {sqlite_path}")
        sys.exit(1)

    print("\n=======================================================")
    print("🚀 HalluciCheck: Migrating SQLite to Supabase PostgreSQL")
    print("=======================================================\n")

    # Connect to SQLite
    sqlite_engine = create_engine(f"sqlite:///{sqlite_path}")
    SQLiteSession = sessionmaker(bind=sqlite_engine)
    sqlite_session = SQLiteSession()

    # Connect to Supabase Postgres
    print(f"Connecting to Supabase at: {target_url.split('@')[-1] if '@' in target_url else 'PostgreSQL'}...")
    try:
        supabase_engine = create_engine(target_url, pool_pre_ping=True)
        # Create tables on Supabase if not exist
        Base.metadata.create_all(bind=supabase_engine)
        SupabaseSession = sessionmaker(bind=supabase_engine)
        supabase_session = SupabaseSession()
        print("✅ Supabase tables verified and initialized successfully.")
    except Exception as e:
        print(f"❌ Failed to connect to Supabase: {e}")
        sys.exit(1)

    try:
        # Fetch SQLite data
        reports = sqlite_session.query(VerificationReport).all()
        claims = sqlite_session.query(Claim).all()
        citations = sqlite_session.query(Citation).all()

        print(f"\nFound in SQLite: {len(reports)} Reports, {len(claims)} Claims, {len(citations)} Citations.")

        # Migrate Reports
        print("Migrating verification reports...")
        for r in reports:
            existing = supabase_session.query(VerificationReport).filter_by(verification_id=r.verification_id).first()
            if not existing:
                new_r = VerificationReport(
                    id=r.id,
                    verification_id=r.verification_id,
                    created_at=r.created_at,
                    model=r.model,
                    overall_confidence=r.overall_confidence,
                    claims_checked=r.claims_checked,
                    verified_count=r.verified_count,
                    suspicious_count=r.suspicious_count,
                    hallucinated_count=r.hallucinated_count,
                    raw_json=r.raw_json
                )
                supabase_session.merge(new_r)

        supabase_session.commit()
        print(f"✅ Migrated {len(reports)} verification reports.")

        # Migrate Claims
        print("Migrating atomic claims...")
        for c in claims:
            new_c = Claim(
                id=c.id,
                report_id=c.report_id,
                text=c.text,
                type=c.type,
                status=c.status,
                confidence=c.confidence,
                evidence=c.evidence,
                source_url=c.source_url,
                reasoning=c.reasoning,
                start_index=c.start_index,
                end_index=c.end_index
            )
            supabase_session.merge(new_c)

        supabase_session.commit()
        print(f"✅ Migrated {len(claims)} claims.")

        # Migrate Citations
        if citations:
            print("Migrating citations...")
            for cit in citations:
                new_cit = Citation(
                    id=cit.id,
                    report_id=cit.report_id,
                    doi=cit.doi,
                    title=cit.title,
                    authors=cit.authors,
                    year=cit.year,
                    url=cit.url
                )
                supabase_session.merge(new_cit)
            supabase_session.commit()
            print(f"✅ Migrated {len(citations)} citations.")

        print("\n🎉 [SUCCESS] Migration complete! All data is now live on Supabase.")
        print("To switch your application to Supabase permanently, set DATABASE_URL in backend/.env\n")

    except Exception as e:
        supabase_session.rollback()
        print(f"\n❌ Error during migration: {e}")
        sys.exit(1)
    finally:
        sqlite_session.close()
        supabase_session.close()

if __name__ == "__main__":
    main()
