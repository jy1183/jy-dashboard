const axios = require('axios');
const cheerio = require('cheerio');

async function debugLH() {
    try {
        const url = 'https://apply.lh.or.kr/lhapply/apply/pch/list.do?mi=1076';
        console.log('Fetching:', url);
        const res = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        console.log('Status:', res.status);
        const $ = cheerio.load(res.data);
        const rows = $('tbody tr');
        console.log('Row count:', rows.length);

        if (rows.length === 0) {
            console.log('No rows found. Dumping body start...');
            console.log($('body').html().substring(0, 500));
        }

        rows.each((i, el) => {
            if (i < 3) {
                console.log(`--- Row ${i} ---`);
                console.log($(el).html());
                console.log('Text:', $(el).text().replace(/\s+/g, ' ').trim());
            }
        });

    } catch (e) {
        console.error(e);
    }
}

debugLH();
