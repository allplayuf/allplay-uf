import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import jsQR from 'npm:jsqr@1.4.0';
import Jimp from 'npm:jimp@0.22.10';
import { Buffer } from "node:buffer";

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            }
        });
    }

    try {
        const base44 = createClientFromRequest(req);
        // We don't strictly need auth for scanning, but good practice
        
        const { image } = await req.json();
        
        if (!image) {
            return Response.json({ error: "No image provided" }, { status: 400 });
        }

        const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, 'base64');
        
        const imageJimp = await Jimp.read(buffer);
        const { data, width, height } = imageJimp.bitmap;
        
        const code = jsQR(data, width, height);
        
        if (code) {
            return Response.json({ text: code.data });
        }
        
        return Response.json({ text: null });

    } catch (error) {
        console.error("Scan error:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});