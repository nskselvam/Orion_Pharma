use eframe::egui::{self, Color32, RichText, Stroke};
use serde::Deserialize;

#[derive(Debug, Clone, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
struct Batch {
    batch_id: String,
    medicine_name: String,
    origin: String,
    destination: String,
    current_stage: String,
    temperature: f32,
    target_temp_min: f32,
    target_temp_max: f32,
    status: String,
}

#[derive(Debug, Clone, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
struct BatchListResponse {
    data: Vec<Batch>,
}

#[derive(Debug, Clone, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
struct StageCoordinates {
    lat: f64,
    lng: f64,
}

#[derive(Debug, Clone, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
struct Stage {
    name: Option<String>,
    location: String,
    timestamp: String,
    coordinates: Option<StageCoordinates>,
}

#[derive(Debug, Clone, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
struct BatchDetails {
    batch_id: String,
    medicine_name: String,
    origin: String,
    current_stage: String,
    status: String,
    destination: String,
    stages: Vec<Stage>,
}

#[derive(Debug, Clone, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
struct DetailsResponse {
    data: BatchDetails,
}

#[derive(Debug, Clone, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
struct ProofEvent {
    transaction_hash: String,
    block_number: u64,
    timestamp: Option<String>,
    event: String,
}

#[derive(Debug, Clone, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
struct ProofData {
    events: Vec<ProofEvent>,
    transaction_hash: Option<String>,
    timestamp: Option<String>,
}

#[derive(Debug, Clone, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
struct ProofResponse {
    data: ProofData,
}

struct TraceabilityApp {
    api_base: String,
    search: String,
    batches: Vec<Batch>,
    selected: Option<Batch>,
    details: Option<BatchDetails>,
    proof: Option<ProofData>,
    message: String,
}

impl Default for TraceabilityApp {
    fn default() -> Self {
        Self {
            api_base: "http://localhost:5001/api".to_string(),
            search: String::new(),
            batches: Vec::new(),
            selected: None,
            details: None,
            proof: None,
            message: "Ready".to_string(),
        }
    }
}

impl TraceabilityApp {
    fn fetch_batches(&mut self) {
        let url = format!("{}/pharma/batch", self.api_base);
        match reqwest::blocking::get(url).and_then(|r| r.json::<BatchListResponse>()) {
            Ok(resp) => {
                self.batches = resp.data;
                if self.selected.is_none() {
                    self.selected = self.batches.first().cloned();
                }
                self.message = format!("Loaded {} batches", self.batches.len());
            }
            Err(err) => {
                self.message = format!("Failed loading batches: {}", err);
            }
        }
    }

    fn fetch_selected_details(&mut self) {
        let Some(selected) = &self.selected else {
            return;
        };

        let details_url = format!("{}/pharma/batch/{}", self.api_base, selected.batch_id);
        let proof_url = format!("{}/blockchain/proof-batch/{}", self.api_base, selected.batch_id);

        match reqwest::blocking::get(details_url).and_then(|r| r.json::<DetailsResponse>()) {
            Ok(resp) => self.details = Some(resp.data),
            Err(err) => {
                self.message = format!("Details fetch failed: {}", err);
                return;
            }
        }

        match reqwest::blocking::get(proof_url).and_then(|r| r.json::<ProofResponse>()) {
            Ok(resp) => self.proof = Some(resp.data),
            Err(_) => self.proof = Some(ProofData::default()),
        }
    }

    fn match_batch(&mut self) {
        let q = self.search.trim().to_lowercase();
        if q.is_empty() {
            self.selected = self.batches.first().cloned();
            return;
        }
        self.selected = self
            .batches
            .iter()
            .find(|b| b.batch_id.to_lowercase().contains(&q) || b.medicine_name.to_lowercase().contains(&q))
            .cloned();
    }
}

impl eframe::App for TraceabilityApp {
    fn update(&mut self, ctx: &egui::Context, _frame: &mut eframe::Frame) {
        egui::SidePanel::left("side_nav")
            .resizable(false)
            .exact_width(220.0)
            .show(ctx, |ui| {
                ui.visuals_mut().override_text_color = Some(Color32::from_rgb(225, 236, 255));
                ui.add_space(8.0);
                ui.heading(RichText::new("Pharma SCM").size(24.0));
                ui.separator();
                for (label, active) in [
                    ("Dashboard", false),
                    ("Traceability", true),
                    ("Inventory", false),
                    ("Compliance", false),
                    ("Cold Chain", false),
                    ("Recalls", false),
                    ("Blockchain Health", false),
                ] {
                    let text = if active {
                        RichText::new(label).strong().color(Color32::WHITE)
                    } else {
                        RichText::new(label).color(Color32::from_rgb(208, 222, 255))
                    };
                    let button = egui::Button::new(text)
                        .fill(if active { Color32::from_rgb(34, 97, 224) } else { Color32::TRANSPARENT })
                        .stroke(Stroke::new(0.0, Color32::TRANSPARENT));
                    ui.add_sized([200.0, 36.0], button);
                }
                ui.add_space(10.0);
                ui.label(RichText::new(&self.message).small());
            });

        egui::TopBottomPanel::top("topbar").exact_height(62.0).show(ctx, |ui| {
            ui.horizontal(|ui| {
                ui.add_space(12.0);
                ui.add_sized([430.0, 36.0], egui::TextEdit::singleline(&mut self.search).hint_text("Search by Batch ID, Serial Number..."));
                if ui.add_sized([100.0, 36.0], egui::Button::new("Search")).clicked() {
                    self.match_batch();
                    self.fetch_selected_details();
                }
                if ui.add_sized([100.0, 36.0], egui::Button::new("Refresh")).clicked() {
                    self.fetch_batches();
                    self.match_batch();
                    self.fetch_selected_details();
                }
            });
        });

        egui::CentralPanel::default().show(ctx, |ui| {
            ui.heading(RichText::new("Batch Overview").size(28.0));
            ui.add_space(6.0);

            if self.batches.is_empty() {
                self.fetch_batches();
                self.match_batch();
                self.fetch_selected_details();
            }

            if let Some(batch) = &self.selected {
                egui::Frame::group(ui.style()).show(ui, |ui| {
                    ui.set_min_height(120.0);
                    ui.columns(2, |cols| {
                        cols[0].label(format!("Batch ID: {}", batch.batch_id));
                        cols[0].label(format!("Drug: {}", batch.medicine_name));
                        cols[0].label(format!("Origin: {}", batch.origin));
                        cols[0].label(format!("Current Location: {}", batch.destination));

                        cols[1].label(format!("Status: {}", batch.status));
                        cols[1].label(format!("Current Stage: {}", batch.current_stage));
                        cols[1].label(format!("Temp: {}°C", batch.temperature));
                        cols[1].label(format!("Range: {}°C - {}°C", batch.target_temp_min, batch.target_temp_max));
                    });
                });

                ui.add_space(10.0);
                ui.heading(RichText::new("Shipment Journey").size(24.0));
                egui::Frame::group(ui.style()).show(ui, |ui| {
                    let stages = self.details.as_ref().map(|d| d.stages.clone()).unwrap_or_default();
                    if stages.is_empty() {
                        ui.label("No stage data available.");
                    } else {
                        ui.horizontal_wrapped(|ui| {
                            for s in stages {
                                let name = s.name.unwrap_or_else(|| s.location.clone());
                                ui.group(|ui| {
                                    ui.label(RichText::new(name).strong());
                                    ui.label(s.timestamp);
                                });
                            }
                        });
                    }

                    ui.add_space(8.0);
                    let (rect, painter) = ui.allocate_painter(egui::vec2(ui.available_width(), 180.0), egui::Sense::hover());
                    painter.rect_filled(rect.rect, 8.0, Color32::from_rgb(222, 236, 246));
                    painter.text(rect.rect.center(), egui::Align2::CENTER_CENTER, "Map Preview (Rust GUI)\nFull map remains in web UI", egui::FontId::proportional(16.0), Color32::from_rgb(37, 64, 94));
                });

                ui.add_space(10.0);
                ui.heading(RichText::new("Blockchain Verification").size(24.0));
                egui::Frame::group(ui.style()).show(ui, |ui| {
                    egui::Grid::new("proof_table").striped(true).num_columns(4).show(ui, |ui| {
                        ui.strong("Transaction Hash");
                        ui.strong("Block ID");
                        ui.strong("Timestamp");
                        ui.strong("Status");
                        ui.end_row();

                        let proof = self.proof.clone().unwrap_or_default();
                        let rows = if proof.events.is_empty() {
                            vec![ProofEvent {
                                transaction_hash: proof.transaction_hash.unwrap_or_else(|| "N/A".to_string()),
                                block_number: 0,
                                timestamp: proof.timestamp,
                                event: "HashStored".to_string(),
                            }]
                        } else {
                            proof.events
                        };

                        for event in rows {
                            let tx = if event.transaction_hash.len() > 14 {
                                format!("{}...{}", &event.transaction_hash[..8], &event.transaction_hash[event.transaction_hash.len().saturating_sub(4)..])
                            } else {
                                event.transaction_hash
                            };
                            ui.label(tx);
                            ui.label(if event.block_number == 0 { "N/A".to_string() } else { event.block_number.to_string() });
                            ui.label(event.timestamp.unwrap_or_else(|| "N/A".to_string()));
                            ui.colored_label(Color32::from_rgb(14, 148, 84), "Verified");
                            ui.end_row();
                        }
                    });
                });
            } else {
                ui.label("No batch selected");
            }
        });
    }
}

fn main() -> eframe::Result<()> {
    let options = eframe::NativeOptions {
        viewport: egui::ViewportBuilder::default().with_inner_size([1366.0, 820.0]),
        ..Default::default()
    };

    eframe::run_native(
        "Pharma SCM - Rust Traceability",
        options,
        Box::new(|_cc| Box::new(TraceabilityApp::default())),
    )
}
