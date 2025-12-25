#!/usr/bin/env python3
"""
Database User Search Tool
A standalone CLI tool to search user information from the NuPeer database
"""
import sys
import argparse
from datetime import datetime
from typing import Optional, List
from sqlalchemy import create_engine, or_, and_, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.dialects.postgresql import UUID
import uuid


# User Model (standalone, doesn't import from app)
class User:
    """User model for database queries"""
    __tablename__ = "users"
    
    def __init__(self, id, email, first_name, last_name, pledge_class, 
                 graduation_year, major, hashed_password, created_at, updated_at):
        self.id = id
        self.email = email
        self.first_name = first_name
        self.last_name = last_name
        self.pledge_class = pledge_class
        self.graduation_year = graduation_year
        self.major = major
        self.hashed_password = hashed_password
        self.created_at = created_at
        self.updated_at = updated_at
    
    def __repr__(self):
        return f"User(id={self.id}, email={self.email}, name={self.first_name} {self.last_name})"


class DatabaseSearcher:
    """Database search utility"""
    
    def __init__(self, database_url: str):
        """Initialize database connection"""
        # Force IPv4 connection
        if "localhost" in database_url:
            database_url = database_url.replace("localhost", "127.0.0.1")
        
        self.engine = create_engine(
            database_url,
            pool_pre_ping=True,
            connect_args={"connect_timeout": 10}
        )
        self.SessionLocal = sessionmaker(bind=self.engine)
    
    def search_by_email(self, email: str) -> List[dict]:
        """Search users by email (partial match)"""
        db = self.SessionLocal()
        try:
            result = db.execute(
                text("""
                SELECT id, email, first_name, last_name, pledge_class, 
                       graduation_year, major, created_at, updated_at
                FROM users
                WHERE email ILIKE :email
                ORDER BY email
                """),
                {"email": f"%{email}%"}
            )
            return [dict(row._mapping) for row in result]
        finally:
            db.close()
    
    def search_by_name(self, name: str) -> List[dict]:
        """Search users by first or last name (partial match)"""
        db = self.SessionLocal()
        try:
            result = db.execute(
                text("""
                SELECT id, email, first_name, last_name, pledge_class, 
                       graduation_year, major, created_at, updated_at
                FROM users
                WHERE first_name ILIKE :name OR last_name ILIKE :name
                ORDER BY last_name, first_name
                """),
                {"name": f"%{name}%"}
            )
            return [dict(row._mapping) for row in result]
        finally:
            db.close()
    
    def search_by_pledge_class(self, pledge_class: str) -> List[dict]:
        """Search users by pledge class"""
        db = self.SessionLocal()
        try:
            result = db.execute(
                text("""
                SELECT id, email, first_name, last_name, pledge_class, 
                       graduation_year, major, created_at, updated_at
                FROM users
                WHERE pledge_class ILIKE :pledge_class
                ORDER BY graduation_year, last_name
                """),
                {"pledge_class": f"%{pledge_class}%"}
            )
            return [dict(row._mapping) for row in result]
        finally:
            db.close()
    
    def search_by_graduation_year(self, year: int) -> List[dict]:
        """Search users by graduation year"""
        db = self.SessionLocal()
        try:
            result = db.execute(
                text("""
                SELECT id, email, first_name, last_name, pledge_class, 
                       graduation_year, major, created_at, updated_at
                FROM users
                WHERE graduation_year = :year
                ORDER BY last_name, first_name
                """),
                {"year": year}
            )
            return [dict(row._mapping) for row in result]
        finally:
            db.close()
    
    def search_by_major(self, major: str) -> List[dict]:
        """Search users by major (partial match)"""
        db = self.SessionLocal()
        try:
            result = db.execute(
                text("""
                SELECT id, email, first_name, last_name, pledge_class, 
                       graduation_year, major, created_at, updated_at
                FROM users
                WHERE major ILIKE :major
                ORDER BY last_name, first_name
                """),
                {"major": f"%{major}%"}
            )
            return [dict(row._mapping) for row in result]
        finally:
            db.close()
    
    def search_by_id(self, user_id: str) -> Optional[dict]:
        """Search user by UUID"""
        db = self.SessionLocal()
        try:
            result = db.execute(
                text("""
                SELECT id, email, first_name, last_name, pledge_class, 
                       graduation_year, major, created_at, updated_at
                FROM users
                WHERE id = :user_id
                """),
                {"user_id": user_id}
            )
            row = result.fetchone()
            return dict(row._mapping) if row else None
        finally:
            db.close()
    
    def list_all(self, limit: int = 50) -> List[dict]:
        """List all users (with limit)"""
        db = self.SessionLocal()
        try:
            result = db.execute(
                text("""
                SELECT id, email, first_name, last_name, pledge_class, 
                       graduation_year, major, created_at, updated_at
                FROM users
                ORDER BY created_at DESC
                LIMIT :limit
                """),
                {"limit": limit}
            )
            return [dict(row._mapping) for row in result]
        finally:
            db.close()
    
    def get_stats(self) -> dict:
        """Get database statistics"""
        db = self.SessionLocal()
        try:
            total = db.execute(text("SELECT COUNT(*) as count FROM users")).fetchone()
            by_year = db.execute(
                text("""
                SELECT graduation_year, COUNT(*) as count
                FROM users
                WHERE graduation_year IS NOT NULL
                GROUP BY graduation_year
                ORDER BY graduation_year DESC
                """)
            ).fetchall()
            by_pledge = db.execute(
                text("""
                SELECT pledge_class, COUNT(*) as count
                FROM users
                WHERE pledge_class IS NOT NULL
                GROUP BY pledge_class
                ORDER BY count DESC
                """)
            ).fetchall()
            
            return {
                "total_users": total.count if total else 0,
                "by_graduation_year": {row.graduation_year: row.count for row in by_year},
                "by_pledge_class": {row.pledge_class: row.count for row in by_pledge}
            }
        finally:
            db.close()


def format_user(user: dict) -> str:
    """Format user information for display"""
    lines = [
        f"ID: {user['id']}",
        f"Email: {user['email']}",
        f"Name: {user['first_name']} {user['last_name']}",
    ]
    
    if user.get('pledge_class'):
        lines.append(f"Pledge Class: {user['pledge_class']}")
    
    if user.get('graduation_year'):
        lines.append(f"Graduation Year: {user['graduation_year']}")
    
    if user.get('major'):
        lines.append(f"Major: {user['major']}")
    
    if user.get('created_at'):
        created = user['created_at']
        if isinstance(created, datetime):
            lines.append(f"Created: {created.strftime('%Y-%m-%d %H:%M:%S')}")
        else:
            lines.append(f"Created: {created}")
    
    if user.get('updated_at'):
        updated = user['updated_at']
        if isinstance(updated, datetime):
            lines.append(f"Updated: {updated.strftime('%Y-%m-%d %H:%M:%S')}")
        else:
            lines.append(f"Updated: {updated}")
    
    return "\n".join(lines)


def main():
    """Main CLI entry point"""
    parser = argparse.ArgumentParser(
        description="Search user information from NuPeer database",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Search by email
  python dbsearch.py --email john@example.com
  
  # Search by name
  python dbsearch.py --name "John"
  
  # Search by pledge class
  python dbsearch.py --pledge-class "Alpha"
  
  # Search by graduation year
  python dbsearch.py --year 2024
  
  # Search by major
  python dbsearch.py --major "Computer Science"
  
  # Search by user ID
  python dbsearch.py --id "1a4c07d8-d132-4062-9b74-79593355e7bf"
  
  # List all users (limited to 50)
  python dbsearch.py --list-all
  
  # Show database statistics
  python dbsearch.py --stats
        """
    )
    
    # Database connection
    parser.add_argument(
        "--db-url",
        default="postgresql://nupeer:nupeer@localhost:5433/nupeer",
        help="Database connection URL (default: postgresql://nupeer:nupeer@localhost:5433/nupeer)"
    )
    
    # Search options
    parser.add_argument("--email", help="Search by email (partial match)")
    parser.add_argument("--name", help="Search by first or last name (partial match)")
    parser.add_argument("--pledge-class", dest="pledge_class", help="Search by pledge class")
    parser.add_argument("--year", type=int, help="Search by graduation year")
    parser.add_argument("--major", help="Search by major (partial match)")
    parser.add_argument("--id", help="Search by user ID (UUID)")
    
    # Other options
    parser.add_argument("--list-all", action="store_true", help="List all users (limit 50)")
    parser.add_argument("--stats", action="store_true", help="Show database statistics")
    parser.add_argument("--limit", type=int, default=50, help="Limit results (default: 50)")
    
    args = parser.parse_args()
    
    # Initialize searcher
    try:
        searcher = DatabaseSearcher(args.db_url)
    except Exception as e:
        print(f"Error connecting to database: {e}", file=sys.stderr)
        print(f"Database URL: {args.db_url}", file=sys.stderr)
        sys.exit(1)
    
    # Perform search
    try:
        results = None
        
        if args.id:
            result = searcher.search_by_id(args.id)
            if result:
                print(format_user(result))
            else:
                print(f"No user found with ID: {args.id}")
        
        elif args.email:
            results = searcher.search_by_email(args.email)
        
        elif args.name:
            results = searcher.search_by_name(args.name)
        
        elif args.pledge_class:
            results = searcher.search_by_pledge_class(args.pledge_class)
        
        elif args.year:
            results = searcher.search_by_graduation_year(args.year)
        
        elif args.major:
            results = searcher.search_by_major(args.major)
        
        elif args.list_all:
            results = searcher.list_all(args.limit)
        
        elif args.stats:
            stats = searcher.get_stats()
            print(f"\nDatabase Statistics:")
            print(f"Total Users: {stats['total_users']}")
            
            if stats['by_graduation_year']:
                print(f"\nBy Graduation Year:")
                for year, count in stats['by_graduation_year'].items():
                    print(f"  {year}: {count} users")
            
            if stats['by_pledge_class']:
                print(f"\nBy Pledge Class:")
                for pledge, count in stats['by_pledge_class'].items():
                    print(f"  {pledge}: {count} users")
        
        else:
            parser.print_help()
            sys.exit(1)
        
        # Display results
        if results is not None:
            if not results:
                print("No users found.")
            else:
                print(f"\nFound {len(results)} user(s):\n")
                print("=" * 80)
                for i, user in enumerate(results, 1):
                    print(f"\n[{i}]")
                    print(format_user(user))
                    if i < len(results):
                        print("-" * 80)
    
    except Exception as e:
        print(f"Error performing search: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()

