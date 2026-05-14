# Complexity Budget Schema

```yaml
version: 0.1
scope: agent-continuity-kit
core:
  max_lines_target: 350
  max_lines_hard: 450
  max_utf8_bytes_target: 24576
  max_utf8_bytes_hard: 32768
  max_mandatory_terms_target: 15
  max_mandatory_terms_hard: 25
  max_must_terms_target: 40
  max_must_terms_hard: 60
  max_trigger_terms_target: 15
  max_trigger_terms_hard: 25
  required_contract_sections:
    - startup_reads
    - execution_loop
    - safety_boundaries
    - closeout_handoff
    - pack_loading
always_read:
  max_files_target: 4
  max_files_hard: 5
packs:
  max_pack_count_target: 8
  max_pack_count_hard: 10
  max_pack_lines_target: 180
  max_pack_lines_hard: 250
  required_pack_sections:
    - scope
    - load_when
    - rules
    - checks
    - closeout
registries:
  doc_sync_max_prose_paragraphs: 5
  project_index_required_tables:
    - stack
    - directory_map
    - entry_points
    - checks
stop_rules:
  single_low_risk_incident_can_enter_core: false
  release_only_rule_can_enter_core: false
  project_specific_rule_can_enter_core: false
```

Target breach means review and simplify before release. Hard breach blocks lightweight release claim.
