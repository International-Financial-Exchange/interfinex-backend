import express from "express";

class GlobalApi {
    static PORT = 8080;
    app = express();

    async start() {
        this.app.listen(GlobalApi.PORT, () => {
            console.log(`\n🚀 API started and listening at port: ${GlobalApi.PORT}\n`)
        });
    }
}

export const GLOBAL_API = new GlobalApi();