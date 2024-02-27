// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::process;
use std::{env, fs};

use tauri::{App, Error as TauriError};

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
    Name,
}

#[tauri::command]
fn is_folder(path: String) -> bool {
    fs::metadata(path).map(|m| m.is_dir()).unwrap_or(false)
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
                        if is_dir && name.to_string_lossy().starts_with(".") {
                            continue;
                        }
                        let info = FileInfoData {
                            path: path.to_string_lossy().to_string(),
                            filename: name.to_string_lossy().to_string(),
                            name: name.to_string_lossy().to_string(),
                            ext: ext.map(|s| s.to_string_lossy().to_string()),
                            kind: if is_dir {
                                "directory".to_string()
                            } else {
                                "file".to_string()
                            },
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

fn check_if_cli_dir_exists(app: &mut App) -> Result<(), String> {
    match app.get_cli_matches() {
        Ok(matches) => {
            if let Some(dir) = matches.args["directory"].value.as_str() {
                if !is_folder(dir.to_string()) {
                    return Err(format!("Invalid directory passed as argument: {}", dir));
                }
            }

            Ok(())
        }
        Err(err) => Err(format!("CLI Error: {}", err.to_string())),
    }
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let app_status = tauri::Builder::default()
        .setup(|app| {
            let _ = check_if_cli_dir_exists(app)?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![list_files, get_homedir, is_folder])
        .run(tauri::generate_context!());

    match app_status {
        Ok(_) => Ok(()),
        Err(TauriError::Setup(e)) => {
            eprintln!("Invalid Arguments\n{}", e);
            process::exit(1);
        }
        Err(e) => Err(Box::new(e)),
    }
}
