# PostgreSQL Enum Serialization Fix

## Problem

When using SQLAlchemy's `native_enum=True` with PostgreSQL, enum values were being serialized incorrectly, causing database errors:

```
Database error: (psycopg2.errors.InvalidTextRepresentation) 
invalid input value for enum pointtype: "HELP_PROVIDED"
```

### Root Cause

The PostgreSQL enum `pointtype` only accepts lowercase values like `'help_provided'`, but SQLAlchemy was attempting to insert the enum name `'HELP_PROVIDED'` instead of the enum value.

This occurred because:
1. Python enum names are uppercase (e.g., `PointType.HELP_PROVIDED`)
2. Python enum values are lowercase (e.g., `PointType.HELP_PROVIDED.value == 'help_provided'`)
3. PostgreSQL enum only accepts the lowercase values
4. With `native_enum=True`, SQLAlchemy may serialize enum instances as their names rather than values

## Solution

### Implementation

The fix was implemented in two places:

#### 1. `backend/app/services/points_service.py`

The `award_points()` function now explicitly extracts the enum value before passing it to SQLAlchemy:

```python
# Explicitly extract the enum value to ensure database compatibility
point_type_value = point_type.value

points_entry = PointsHistory(
    ...
    point_type=point_type_value,  # Pass the enum value string explicitly
    ...
)
```

This ensures the database always receives the correct lowercase value string (`'help_provided'`) instead of the enum name (`'HELP_PROVIDED'`).

#### 2. `backend/app/models/points.py`

The `PointTypeEnum` TypeDecorator provides a fallback conversion layer that handles:
- PointType enum instances → extracts `.value`
- String values (already correct) → returns as-is
- String names (enum names) → converts to value

This provides defense-in-depth in case enum instances are passed directly elsewhere in the codebase.

### Why Both Layers?

1. **Primary Fix (points_service.py)**: Explicitly extracts values at the source, preventing the issue from occurring
2. **Fallback (TypeDecorator)**: Provides safety net for any code paths that might pass enum instances directly

## Testing

To verify the fix works:

1. Award points using any point type:
   ```python
   award_points(db, user_id, PointType.HELP_PROVIDED, description="Test")
   ```

2. Check the database:
   ```sql
   SELECT point_type FROM points_history ORDER BY created_at DESC LIMIT 1;
   ```
   Should return: `help_provided` (not `HELP_PROVIDED`)

## Related Files

- `backend/app/services/points_service.py` - Main fix implementation
- `backend/app/models/points.py` - TypeDecorator fallback
- `backend/alembic/versions/create_points_system.py` - Enum definition migration

## Prevention

When working with PostgreSQL enums in SQLAlchemy:

1. **Always extract enum values explicitly** before passing to SQLAlchemy when using `native_enum=True`
2. **Use TypeDecorator** as a fallback conversion layer
3. **Test enum serialization** to ensure values (not names) are stored
4. **Document enum value requirements** in code comments

## References

- [SQLAlchemy Enum Documentation](https://docs.sqlalchemy.org/en/14/core/type_basics.html#sqlalchemy.types.Enum)
- [PostgreSQL Enum Types](https://www.postgresql.org/docs/current/datatype-enum.html)
- Error reference: https://sqlalche.me/e/20/9h9h

