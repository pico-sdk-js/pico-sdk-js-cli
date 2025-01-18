# Compatibility Between Pico-SDK-JS CLI and ENGINE

The Pico-SDK-JS CLI (Command Line Interface) and the Pico-SDK-JS ENGINE follow a versioning system using the format `MAJOR.MINOR.PATCH` (e.g., `1.2.3`). This document explains how compatibility is determined between these components, ensuring smooth operation and integration.

---

## Understanding Version Numbers

### 1. **MAJOR Version**
   - **Definition**: Indicates significant changes that break compatibility between the CLI and ENGINE.
   - **Compatibility Rule**:
     - If the MAJOR version numbers differ between the CLI and ENGINE (e.g., `1.x.x` and `2.x.x`), the two components are **not compatible**.
   - **Example**:
     - CLI version: `1.2.3`
     - ENGINE version: `2.0.0`
     - Result: **Not Compatible**. You must update both components to the same MAJOR version.

### 2. **MINOR Version**
   - **Definition**: Represents new features or functionality added without breaking existing compatibility.
   - **Compatibility Rule**:
     - The ENGINE’s MINOR version can be ahead of the CLI’s MINOR version. However, the CLI cannot have a higher MINOR version than the ENGINE.
   - **Behavior**:
     - A new REPL command introduced in the ENGINE may require an updated CLI to use it. If the CLI is not updated, existing functionality will still work, but the new REPL command won’t be available.
   - **Example**:
     - CLI version: `1.2.3`
     - ENGINE version: `1.4.0`
     - Result: **Compatible**. The CLI works with existing commands but won’t support features introduced in ENGINE version `1.3.x` or `1.4.x`.
     
     - CLI version: `1.5.0`
     - ENGINE version: `1.4.0`
     - Result: **Not Compatible**. The CLI expects functionality not present in the ENGINE.

### 3. **PATCH Version**
   - **Definition**: Includes minor bug fixes or small changes that do not affect compatibility.
   - **Compatibility Rule**:
     - PATCH versions are fully backward and forward compatible.
     - Any combination of CLI and ENGINE with the same MAJOR and MINOR version is compatible, regardless of PATCH versions.
   - **Example**:
     - CLI version: `1.2.3`
     - ENGINE version: `1.2.5`
     - Result: **Compatible**.

---

## Summary of Compatibility Rules

| CLI Version  | ENGINE Version | Compatibility |
|--------------|----------------|---------------|
| `1.2.3`      | `1.2.4`        | Compatible    |
| `1.2.3`      | `1.3.0`        | Compatible    |
| `1.2.3`      | `2.0.0`        | Not Compatible|
| `1.4.0`      | `1.3.2`        | Not Compatible|

---

## Practical Guidelines for Users

1. **Stay Aligned on MAJOR Versions**:
   - Always ensure the MAJOR version of the CLI matches the MAJOR version of the ENGINE.

2. **Update CLI for New ENGINE Features**:
   - If the ENGINE’s MINOR version is ahead of the CLI and you want to use new features, update the CLI to the latest compatible version.

3. **Ignore PATCH Mismatches**:
   - Don’t worry about differences in PATCH versions; they will not affect compatibility.

---

## Examples

### Example 1: Compatible Versions
- **CLI Version**: `1.2.3`
- **ENGINE Version**: `1.3.5`
- **Outcome**: The CLI will work with the ENGINE, but any features introduced in ENGINE versions `1.3.x` will not be accessible unless the CLI is updated.

### Example 2: Not Compatible (CLI Ahead of ENGINE)
- **CLI Version**: `1.4.0`
- **ENGINE Version**: `1.3.0`
- **Outcome**: The CLI expects features that the ENGINE does not support. Update the ENGINE to version `1.4.x` to restore compatibility.

### Example 3: Not Compatible (Different MAJOR Versions)
- **CLI Version**: `1.2.3`
- **ENGINE Version**: `2.0.0`
- **Outcome**: The CLI and ENGINE cannot work together. Update both components to a common MAJOR version.


