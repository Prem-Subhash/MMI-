const https = require('https');
const fs = require('fs');
const options = {
    hostname: 'welhzcasuabhqoccfxtu.supabase.co',
    path: '/rest/v1/?apikey=sb_publishable_kuXMaWMsxrNuBi3YPPudRg_VjSaOdb7',
    method: 'GET'
};
const req = https.request(options, res => {
    let data = '';
    res.on('data', d => { data += d; });
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            fs.writeFileSync('openapi.json', JSON.stringify(json, null, 2));
            console.log('OpenAPI spec saved');
        } catch (e) {
            console.error(e);
        }
    });
});
req.end();
