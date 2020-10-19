"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DATABASE = void 0;
const { MongoClient } = require("mongodb");
const client = new MongoClient("mongodb://localhost:27017", { useUnifiedTopology: true, replicaSet: "initialReplSet" });
class Database {
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            yield client.connect();
            this.db = client.db(Database.DB_NAME);
            console.log("Connected to mongo server");
        });
    }
}
Database.DB_NAME = "INTERMEX";
exports.DATABASE = new Database();
//# sourceMappingURL=database.js.map