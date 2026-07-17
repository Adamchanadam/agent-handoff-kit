# User Rules Router

This is the formal router and acceptance record for user-controlled rules.
Each JSON entry between the markers records a stable id, path, accepted raw
bytes, original-byte witness, reader relationship, priority, and effect
decision. Registered entries are read in their listed order. A rule whose
current bytes do not match its accepted witness is not active through this
router until a later accepted update replaces the whole record atomically.

<!-- ack:user-rules-registry:start -->
```json
[]
```
<!-- ack:user-rules-registry:end -->

<!-- ack:user-rules-state:start -->
```json
{
  "kitBase": {
    "target": "AGENTS.md",
    "packageVersion": "0.0.0",
    "managedCoreSha256": "0000000000000000000000000000000000000000000000000000000000000000"
  },
  "router": {
    "path": "dev/USER_RULES.md",
    "contentRoot": "dev/user_rules/"
  }
}
```
<!-- ack:user-rules-state:end -->
