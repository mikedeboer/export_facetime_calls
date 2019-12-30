#!/usr/bin/env node
/* use strict */

const Database = require("better-sqlite3");
const OS =  require("os");
const Path = require("path");

const DB_PATH = Path.join(OS.homedir(), "Library", "Application Support", "CallHistoryDB", "CallHistory.storedata");
const DB_NAME = "ZCALLRECORD";
const DB_FIELDS = new Map([
  ["Z_PK", "INTEGER"],
  ["Z_ENT", "INTEGER"],
  ["Z_OPT", "INTEGER"],
  ["ZANSWERED", "INTEGER"],
  ["ZCALL_CATEGORY", "INTEGER"],
  ["ZCALLTYPE", "INTEGER"],
  ["ZDISCONNECTED_CAUSE", "INTEGER"],
  ["ZFACE_TIME_DATA", "INTEGER"],
  ["ZHANDLE_TYPE", "INTEGER"],
  ["ZNUMBER_AVAILABILITY", "INTEGER"],
  ["ZORIGINATED", "INTEGER"],
  ["ZREAD", "INTEGER"],
  ["QDATE", "TIMESTAMP"],
  ["ZDURATION", "FLOAT"],
  ["ZISO_COUNTRY_CODE", "VARCHAR"],
  ["ZLOCATION", "VARCHAR"],
  ["ZNAME", "VARCHAR"],
  ["ZSERVICE_PROVIDER", "VARCHAR"],
  ["ZUNIQUE_ID", "VARCHAR"],
  ["ZLOCALPARTICIPANTUUID", "BLOB"],
  ["ZOUTGOINGLOCALPARTICIPANTUUID", "BLOB"],
  ["ZADDRESS", "BLOB"],
  ["ZLOCAL_ADDRESS", "BLOB"]
]);
const DB_DATE_START = new Date("2001-01-01");

const EXPORT_FIELDS = new Set([
  "datetime('2001-01-01','+' || ZDATE || ' second') as QDATE", "ZANSWERED",
  "ZORIGINATED", "ZDURATION", "ZISO_COUNTRY_CODE", "ZLOCATION", "ZCALLTYPE",
  "ZNAME",
  /*"ZLOCALPARTICIPANTUUID", "ZOUTGOINGLOCALPARTICIPANTUUID", */"ZADDRESS"
]);
const EXPORT_FRIENDLY_NAMES = new Map([
  ["QDATE", "Date"],
  ["ZANSWERED", "Answered"],
  ["ZORIGINATED", "Originated"],
  ["ZDURATION", "Duration"],
  ["ZISO_COUNTRY_CODE", "Country"],
  ["ZLOCATION", "Location"],
  ["ZCALLTYPE", "Type"],
  ["ZNAME", "Name"],
  // ["ZLOCALPARTICIPANTUUID", "From"],
  // ["ZOUTGOINGLOCALPARTICIPANTUUID", "To"],
  ["ZADDRESS", "Address"]
]);
const EXPORT_TRANSFORMERS = {
  "ZANSWERED": value => !!value + "",
  "ZORIGINATED": value => ! !value + "",
  "ZCALLTYPE": value => {
    switch (value) {
      case 1:
        return "Cellular";
      case 8:
        return "FacetimeVideo";
      case 16:
        return "FacetimeAudio";
      default:
        return "Unknown";
    }
  },
  "ZLOCATION": value => value == "<<RecentsNumberLocationNotFound>>" ? "" : value + ""
}
const EXPORT_SEPARATOR = "\t";
  
const db = new Database(DB_PATH);
var records = db.prepare(`
  SELECT ${[...EXPORT_FIELDS].join(", ")}
  FROM ${DB_NAME}
  ORDER BY QDATE DESC`).all();

console.log([...EXPORT_FRIENDLY_NAMES.values()].join(EXPORT_SEPARATOR));
for (var record of records) {
  let fieldCount = 0;
  for (let fieldName of EXPORT_FIELDS) {
    if (++fieldCount != 1) {
      process.stdout.write(EXPORT_SEPARATOR);
    }

    fieldName = fieldName.split(" ").pop();
    let type = DB_FIELDS.get(fieldName);
    let value = record[fieldName];
    if (EXPORT_TRANSFORMERS[fieldName]) {
      process.stdout.write(EXPORT_TRANSFORMERS[fieldName](value, type));
      continue;
    }

    switch (type) {
      case "FLOAT":
        process.stdout.write(Number.parseFloat(value).toFixed(2) + "");
        break;
      case "BLOB":
        if (value) {
          // process.stdout.write(value.toString());
        }
        break;
      case "INTEGER":
      case "VARCHAR":
      case "TIMESTAMP":
      default:
        process.stdout.write(value + "");
        break;
    }
  }
  process.stdout.write("\n");
}
