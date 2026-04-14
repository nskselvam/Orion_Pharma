import { spawn } from 'child_process';
import path from 'path';

export interface RustSecureInput {
  batchId: string;
  hasBlockchainHash: boolean;
  onChainVerified: boolean;
  notCompromised: boolean;
  notRecalled: boolean;
  temperature: number;
  targetTempMin: number;
  targetTempMax: number;
  estimatedFailure?: number;
  activeAlerts?: number;
}

export interface RustSecureOutput {
  batchId: string;
  allowed: boolean;
  mode: 'SECURE_ALLOW' | 'SECURE_DENY';
  reason: string;
  checks: {
    hasBlockchainHash: boolean;
    onChainVerified: boolean;
    notCompromised: boolean;
    notRecalled: boolean;
    temperatureInRange: boolean;
  };
  securityScore: number;
  policyVersion: string;
}

const getRustBinaryPath = (): string => {
  if (process.env.RUST_SECURITY_BIN) {
    return process.env.RUST_SECURITY_BIN;
  }

  const binName = process.platform === 'win32' ? 'secure_os_guard.exe' : 'secure_os_guard';
  return path.resolve(__dirname, '../../../rust-secure-os/target/release', binName);
};

export const runRustSecureVerifier = async (input: RustSecureInput): Promise<RustSecureOutput> => {
  const binaryPath = getRustBinaryPath();

  return new Promise((resolve, reject) => {
    const child = spawn(binaryPath, [], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', (error) => {
      reject(new Error(`Rust security engine unavailable at ${binaryPath}: ${error.message}`));
    });

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Rust security engine exited with code ${code}: ${stderr || stdout}`));
        return;
      }

      try {
        const parsed = JSON.parse(stdout.trim());
        if (parsed.error) {
          reject(new Error(`Rust security engine error: ${parsed.error}`));
          return;
        }
        resolve(parsed as RustSecureOutput);
      } catch (error: any) {
        reject(new Error(`Failed to parse Rust security output: ${error.message}. Raw: ${stdout}`));
      }
    });

    child.stdin.write(JSON.stringify(input));
    child.stdin.end();
  });
};
