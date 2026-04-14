#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
UI_DIR="$ROOT_DIR/rust-traceability-ui"
TARGET="x86_64-unknown-linux-gnu"

if ! command -v cargo >/dev/null 2>&1; then
  echo "ERROR: Rust toolchain not found. Install from https://rustup.rs"
  exit 1
fi

if command -v qemu-x86_64 >/dev/null 2>&1; then
  echo "Building Linux Rust GUI target for QEMU user-mode..."
  rustup target add "$TARGET" >/dev/null
  cd "$UI_DIR"
  cargo build --release --target "$TARGET"

  BIN="$UI_DIR/target/$TARGET/release/rust_traceability_ui"
  if [[ ! -f "$BIN" ]]; then
    echo "ERROR: Build output missing: $BIN"
    exit 1
  fi

  echo "Running Rust GUI via qemu-x86_64..."
  qemu-x86_64 "$BIN"
else
  echo "ERROR: qemu-x86_64 is not installed."
  echo "Install QEMU and retry, or run native with ./run-rust-ui.sh"
  exit 1
fi
