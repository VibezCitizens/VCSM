# Dashboard Module Behavior Contract — leads

Module: leads

Parent Feature: dashboard

## Happy Paths

### HP-001

BEH-DASH-leads-001

Owner opens the leads inbox and views incoming leads.

## Security Rules

- Owner must pass actor ownership before lead data is returned.

## Must Never Happen

- Non-owner actor must never view lead PII.
