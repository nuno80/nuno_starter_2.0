// src/lib/db/index.ts
import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

// Commenta o rimuovi i log dettagliati se diventano troppo verbosi per lo starter kit finale
// console.log("[DB_INIT] Starting database initialization...");

const projectRoot = process.cwd();
const dbDir = path.join(projectRoot, "database");
const dbPath = path.join(dbDir, "starter_default.db"); // Nome generico per lo starter
const schemaPath = path.join(dbDir, "schema.sql"); // Percorso al file dello schema

// console.log(`[DB_INIT] Expected database file path: ${dbPath}`);
// console.log(`[DB_INIT] Expected schema file path: ${schemaPath}`);

// Assicurati che la directory del database esista
if (!fs.existsSync(dbDir)) {
  // console.log(`[DB_INIT] Database directory ${dbDir} does not exist. Attempting to create...`);
  try {
    fs.mkdirSync(dbDir, { recursive: true });
    // console.log(`[DB_INIT] Successfully created database directory: ${dbDir}`);
  } catch (error) {
    console.error(
      `[DB_INIT] CRITICAL: Failed to create database directory ${dbDir}:`,
      error
    );
    throw new Error(`Failed to create database directory: ${error}`); // Ferma l'app se non può creare la dir
  }
}

let dbInstance: Database.Database;
const dbFileExistedBeforeConnection = fs.existsSync(dbPath); // Controlla se il file DB esiste PRIMA

try {
  // console.log(`[DB_INIT] Attempting to connect to/create SQLite database at: ${dbPath}`);
  dbInstance = new Database(dbPath, {
    // verbose: (message: unknown, ...additionalArgs: unknown[]) =>
    //   console.log("[BETTER-SQLITE3]", message, ...additionalArgs)
  });
  // console.log(`[DB_INIT] Successfully connected to/created SQLite database: ${dbPath}`);

  dbInstance.pragma("journal_mode = WAL");
  // console.log("[DB_INIT] WAL mode enabled.");

  // Se il file del database NON esisteva prima di questa connessione, significa che è stato appena creato.
  // In tal caso, applichiamo lo schema.
  if (!dbFileExistedBeforeConnection) {
    console.log(
      `Nuovo database "${path.basename(dbPath)}" creato. Tentativo di applicare lo schema da ${schemaPath}.`
    );
    if (fs.existsSync(schemaPath)) {
      try {
        const schemaSql = fs.readFileSync(schemaPath, "utf8");
        if (schemaSql.trim() !== "") {
          // Esegui solo se lo schema non è vuoto
          dbInstance.exec(schemaSql);
          console.log("Schema SQL applicato con successo.");
        } else {
          console.log(
            `File schema.sql (${schemaPath}) trovato ma è vuoto. Nessuno schema è stato applicato.`
          );
        }
      } catch (schemaError) {
        console.error(
          `Errore durante l'applicazione dello schema SQL da ${schemaPath}:`,
          schemaError
        );
        // Potresti voler gestire questo errore in modo più specifico, es. cancellando il file .db appena creato
      }
    } else {
      console.warn(
        `File schema.sql non trovato in ${schemaPath}. Il database sarà creato vuoto (schema non applicato). Assicurati di creare e popolare database/schema.sql con le tue tabelle.`
      );
    }
  } else {
    // console.log(`Connesso al database esistente: ${dbPath}`);
  }
} catch (error) {
  console.error(
    "[DB_INIT] CRITICAL: Failed to connect to SQLite database:",
    error
  );
  throw new Error(`Failed to initialize SQLite database: ${error}`);
}

export const db = dbInstance;

export const closeDbConnection = () => {
  if (db && db.open) {
    db.close();
    // console.log("[DB_INIT] SQLite database connection closed.");
  }
};

process.on("SIGINT", () => {
  closeDbConnection();
  process.exit(0);
});

process.on("SIGTERM", () => {
  closeDbConnection();
  process.exit(0);
});

// console.log("[DB_INIT] Database module initialized.");
