// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

#[derive(serde::Serialize)]
struct Session {
    path: String,
}

#[derive(serde::Serialize)]
struct FileInfoData {
    path: String,
    name: String,
    ext: Option<String>,
    icon: Option<String>,
}

#[tauri::command]
fn list_files() -> Result<Vec<FileInfoData>, String> {
    let path = ".";
    let mut result = Vec::new();
    match std::fs::read_dir(path) {
        Ok(entries) => {
            for entry in entries {
                match entry {
                    Ok(entry) => {
                        let path = entry.path();
                        let name = entry.file_name();
                        let ext = path.extension();
                        result.push(FileInfoData {
                            path: path.to_string_lossy().to_string(),
                            name: name.to_string_lossy().to_string(),
                            ext: ext.map(|s| s.to_string_lossy().to_string()),
                            icon: None,
                        });
                    }
                    Err(e) => {
                        return Err(e.to_string());
                    }
                }
            }
        }
        Err(e) => {
            return Err(e.to_string());
        }
    }
    Ok(result)
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![list_files])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
