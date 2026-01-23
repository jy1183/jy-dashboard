const axios = require('axios');
const cheerio = require('cheerio');

async function testParse() {
    try {
        const url = 'https://apply.lh.or.kr/lhapply/apply/pch/list.do?mi=1076';
        console.log('Fetching:', url);
        const res = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        const $ = cheerio.load(res.data);
        const notices = [];

        $('tbody tr').each((i, el) => {
            const cells = $(el).find('td');
            if (cells.length > 0) {
                const titleEl = $(cells).find('.tit a').first();
                const title = titleEl.text().trim(); // || $(cells).eq(2).text().trim();

                const rowText = $(el).text();
                // Match YYYY-MM-DD or YYYY.MM.DD
                const dateMatches = rowText.match(/(\d{4}[.-]\d{2}[.-]\d{2})/g);
                const noticeDate = dateMatches && dateMatches.length > 0 ? dateMatches[0] : '-';
                const deadline = dateMatches && dateMatches.length > 1 ? dateMatches[1] : '-';

                // Debugging specific row
                console.log(`Row ${i}:`);
                console.log('  Raw Text:', rowText.replace(/\s+/g, ' ').substring(0, 100));
                console.log('  Date Matches:', dateMatches);
                console.log('  Title found:', !!title);
                console.log('  Title text:', title);

                if (title) {
                    notices.push({ title, noticeDate, deadline });
                }
            }
        });

        console.log('Parsed Notices:', notices.length);
        console.log(notices);

    } catch (e) {
        console.error(e);
    }
}

testParse();
