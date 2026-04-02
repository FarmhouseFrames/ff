# Supabase Storage Policies (UI Fallback)

Use this when SQL Editor cannot modify `storage.objects` and returns:

`ERROR: must be owner of table objects`

## Prerequisite

1. Run [policies-core.sql](./policies-core.sql) in SQL Editor first.
2. Then open Supabase Dashboard -> Storage -> Policies.

## Bucket: `photo-uploads`

Create these policies:

### 1) Admin upload photo-uploads

- Operation: `INSERT`
- Roles: `authenticated`
- WITH CHECK:

```sql
bucket_id = 'photo-uploads' and public.is_admin()
```

### 2) Admin update photo-uploads

- Operation: `UPDATE`
- Roles: `authenticated`
- USING:

```sql
bucket_id = 'photo-uploads' and public.is_admin()
```

- WITH CHECK:

```sql
bucket_id = 'photo-uploads' and public.is_admin()
```

### 3) Admin delete photo-uploads

- Operation: `DELETE`
- Roles: `authenticated`
- USING:

```sql
bucket_id = 'photo-uploads' and public.is_admin()
```

## Optional additional admin buckets

If you use other buckets (`uploads`, `order-files`, `case-files`), repeat the same policies for each bucket by changing `bucket_id`.
