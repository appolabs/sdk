# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Capability handshake: `appo.getCapabilities()` resolves the native host's `protocolVersion`, `nativeVersion`, and supported `features`, letting web apps feature-detect at runtime
- `appo.supports(feature)` convenience helper matching a feature namespace (`'push'`) or method (`'push.getToken'`)
- `PROTOCOL_VERSION` export and `Capabilities` type
- New `system.getCapabilities` bridge message (native host responds with `{ protocolVersion, nativeVersion, features }`)
- Graceful degradation: the probe uses a short 2s timeout and never rejects — legacy native hosts fall back to the baseline feature set, browsers to an empty set, so unsupported calls fail fast instead of hanging for the full 30s request timeout

## [2.0.0] - 2026-06-06

### Added

- Runtime type validation for all native bridge responses via type guards (`isBridgeResponse`, `isBridgeEvent`)
- Structured error handling with `AppoError` class and categorized error codes (`NOT_NATIVE`, `TIMEOUT`, `NATIVE_ERROR`, `BRIDGE_UNAVAILABLE`)
- Optional logger system via `setLogger()` for observing bridge activity without console output
- Build-time version injection (`VERSION` export matches package.json)
- Push notification tap events via `push.onResponse()`
- Network change events via `network.onChange()` with browser fallback to `online`/`offline` events
- Comprehensive test suite: 97 tests (63 unit + 34 integration) covering bridge communication, event lifecycle, error paths, and all 9 feature APIs
- Integration test infrastructure for SDK-wrapper validation

### Changed

- Package renamed from `@appolabs/appo` to `@appolabs/sdk`
- Version string now injected at build time via `__SDK_VERSION__` define (was hardcoded constant)
- Error responses from native layer wrapped in `AppoError` with categorized codes (was generic `Error`)

### Fixed

- Version mismatch between package.json and runtime version constant

## [1.0.1] - Initial Release

Initial public release with 9 feature APIs: push notifications, biometrics, camera, location, haptics, storage, share, network, and device.
