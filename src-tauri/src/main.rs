// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::env;

use serde::de;

#[derive(serde::Serialize)]
struct Session {
    path: String,
}

#[derive(serde::Serialize)]
struct FileInfoData {
    path: String,
    filename: String,
    name: String,
    ext: Option<String>,
    icon: Option<String>,
    kind: String,
}

#[derive(serde::Serialize, serde::Deserialize)]
enum EOrderBy {
    Name
}

#[tauri::command]
fn get_homedir() -> String {
    env::home_dir()
        .map(|p| p.to_string_lossy().to_string())
        .unwrap_or_else(|| "".to_string())
}

#[tauri::command]
fn list_files(path: String, order_by: EOrderBy) -> Result<Vec<FileInfoData>, String> {
    let mut files = Vec::new();
    let mut folders = Vec::new();
    match std::fs::read_dir(path) {
        Ok(entries) => {
            for entry in entries {
                match entry {
                    Ok(entry) => {
                        let path = entry.path();
                        let name = entry.file_name();
                        let ext = path.extension();
                        let is_dir = path.is_dir();
                        let info =FileInfoData {
                            path: path.to_string_lossy().to_string(),
                            filename: name.to_string_lossy().to_string(),
                            name: name.to_string_lossy().to_string(),
                            ext: ext.map(|s| s.to_string_lossy().to_string()),
                            kind: if is_dir { "directory".to_string() } else { "file".to_string() },
                            icon: None,
                        };

                        if is_dir {
                            folders.push(info);
                        } else {
                            files.push(info);
                        }
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

    let mut result = Vec::new();

    match order_by {
        EOrderBy::Name => {
            folders.sort_by(|a, b| a.name.cmp(&b.name));
            files.sort_by(|a, b| a.name.cmp(&b.name));
        }
    }

    result.extend(folders);
    result.extend(files);

    Ok(result)
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![list_files, get_homedir])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
