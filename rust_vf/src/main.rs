use serde::{Deserialize, Serialize};
use std::io::{self, Read};

#[derive(Debug, Deserialize)]
struct SecureInput {
    #[serde(rename = "batchId")]
    batch_id: String,
    #[serde(rename = "hasBlockchainHash")]
    has_blockchain_hash: bool,
    #[serde(rename = "onChainVerified")]
    on_chain_verified: bool,
    #[serde(rename = "notCompromised")]
    not_compromised: bool,
    #[serde(rename = "notRecalled")]
    not_recalled: bool,
    #[serde(rename = "temperature")]
    temperature: f64,
    #[serde(rename = "targetTempMin")]
    target_temp_min: f64,
    #[serde(rename = "targetTempMax")]
    target_temp_max: f64,
    #[serde(rename = "estimatedFailure")]
    estimated_failure: Option<u8>,
    #[serde(rename = "activeAlerts")]
    active_alerts: Option<u8>,
}

#[derive(Debug, Serialize)]
struct Checks {
    #[serde(rename = "hasBlockchainHash")]
    has_blockchain_hash: bool,
    #[serde(rename = "onChainVerified")]
    on_chain_verified: bool,
    #[serde(rename = "notCompromised")]
    not_compromised: bool,
    #[serde(rename = "notRecalled")]
    not_recalled: bool,
    #[serde(rename = "temperatureInRange")]
    temperature_in_range: bool,
}

#[derive(Debug, Serialize)]
struct SecureOutput {
    #[serde(rename = "batchId")]
    batch_id: String,
    allowed: bool,
    mode: String,
    reason: String,
    checks: Checks,
    #[serde(rename = "securityScore")]
    security_score: u8,
    #[serde(rename = "policyVersion")]
    policy_version: String,
}

fn main() {
    let mut input = String::new();
    if io::stdin().read_to_string(&mut input).is_err() {
        print_error("Failed to read stdin");
        return;
    }

    let parsed: SecureInput = match serde_json::from_str(&input) {
        Ok(v) => v,
        Err(_) => {
            print_error("Invalid JSON input");
            return;
        }
    };

    let temperature_in_range = parsed.temperature >= parsed.target_temp_min && parsed.temperature <= parsed.target_temp_max;

    let checks = Checks {
        has_blockchain_hash: parsed.has_blockchain_hash,
        on_chain_verified: parsed.on_chain_verified,
        not_compromised: parsed.not_compromised,
        not_recalled: parsed.not_recalled,
        temperature_in_range,
    };

    let mut security_score: i32 = 100;

    if !checks.has_blockchain_hash {
        security_score -= 30;
    }
    if !checks.on_chain_verified {
        security_score -= 35;
    }
    if !checks.not_compromised {
        security_score -= 20;
    }
    if !checks.not_recalled {
        security_score -= 60;
    }
    if !checks.temperature_in_range {
        security_score -= 20;
    }

    if let Some(failure) = parsed.estimated_failure {
        if failure >= 80 {
            security_score -= 20;
        } else if failure >= 60 {
            security_score -= 10;
        }
    }

    if let Some(alerts) = parsed.active_alerts {
        if alerts >= 5 {
            security_score -= 10;
        } else if alerts >= 3 {
            security_score -= 5;
        }
    }

    if security_score < 0 {
        security_score = 0;
    }

    let critical_checks_ok = checks.has_blockchain_hash
        && checks.on_chain_verified
        && checks.not_recalled
        && checks.not_compromised
        && checks.temperature_in_range;

    let allowed = critical_checks_ok && security_score >= 60;

    let reason = if allowed {
        "Rust secure policy passed. Batch allowed for critical operations.".to_string()
    } else if !checks.not_recalled {
        "Batch is recalled. Rust policy denies all critical operations.".to_string()
    } else if !checks.on_chain_verified {
        "On-chain verification failed. Rust policy denies execution.".to_string()
    } else if !checks.temperature_in_range {
        "Temperature out of approved range. Rust policy denies execution.".to_string()
    } else {
        "Rust secure policy failed due to risk/health checks.".to_string()
    };

    let output = SecureOutput {
        batch_id: parsed.batch_id,
        allowed,
        mode: if allowed { "SECURE_ALLOW".to_string() } else { "SECURE_DENY".to_string() },
        reason,
        checks,
        security_score: security_score as u8,
        policy_version: "rust-secure-os-1.0.0".to_string(),
    };

    match serde_json::to_string(&output) {
        Ok(json) => println!("{}", json),
        Err(_) => print_error("Failed to serialize output"),
    }
}

fn print_error(message: &str) {
    println!("{{\"error\":\"{}\"}}", message);
}
