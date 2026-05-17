# Knowledge Pack

## Scope

Use for external notes, knowledge bases, Notion, Obsidian, Drive, docs repositories, and source-of-truth mapping.

## Load When

- User references external knowledge tools or asks to sync project knowledge outside local files.
- Project truth may be split between local markdown and an external system.

## Rules

1. Determine whether the external surface is source of truth, mirror, index, or attachment store.
2. Record access mode and sync expectation before relying on external content.
3. Prefer local durable files for installable runtime text unless the project declares otherwise.
4. Do not perform destructive external writes without explicit confirmation.
5. If direct access is unavailable, produce a ready-to-paste sync packet and mark status pending.
6. When writing to an external mirror or index, read back the written record before claiming sync success.
7. Preserve local file paths as plain text, code, or structured rich text fields when the external tool parses Markdown links or escape characters.

## Checks

- Verify external source identity, timestamp, and scope.
- Check `dev/DOC_SYNC_REGISTRY.md` for required sync targets and status vocabulary.
- Record conflicts between local and external content.
- Mark unread relevant sources as unread, pending, or blocked. Do not treat unread sources as absent.

## Closeout

Record external sync status, pending paste/manual steps, unresolved conflicts, and next verification point.
