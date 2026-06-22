# Join — Performance Report

**KRAVEN status:** NOT_STARTED

The join flow is a one-shot operation (QR scan + single accept). Not expected to be a performance concern. KRAVEN should confirm that `acceptJoinResourceDAL` is a single atomic write without N+1 patterns and that the QR preview read is lightweight.
