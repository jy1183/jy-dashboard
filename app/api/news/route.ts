import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET() {
    try {
        // 1. Get the main page to find the current "Card Unit" ID (CU_CODE)
        // We use a realistic User-Agent to avoid being blocked.
        const mainPage = await axios.get('https://www.bdsplanet.com/inside/news/main.ytp', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        // Extract CU_CODE using regex
        // We look for the OG:URL or similar structure: inside/news/main/CU_1767832548983300.ytp
        const cuCodeMatch = mainPage.data.match(/inside\/news\/main\/(CU_\d+)\.ytp/);

        if (!cuCodeMatch || !cuCodeMatch[1]) {
            console.error('Could not find CU_CODE in main page HTML');
            throw new Error('Could not find News ID (CU_CODE)');
        }

        const cuCode = cuCodeMatch[1];

        // 2. Fetch the detail data using the CU_CODE
        // The site uses this internal API to populate the news list.
        const detailUrl = `https://www.bdsplanet.com/inside/news/detailData/${cuCode}.ytp`;

        const detailResponse = await axios.get(detailUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://www.bdsplanet.com/inside/news/main.ytp'
            }
        });

        // 3. Transform the data
        const articles = detailResponse.data.detailItems ? detailResponse.data.detailItems.map((item: any) => ({
            title: item.CU_TITLE,
            link: item.CU_LINK.startsWith('http') ? item.CU_LINK : `https://${item.CU_LINK}`,
            media: item.CU_MEDIA,
            type: item.CU_TYPE1_NM
        })) : [];

        return NextResponse.json({
            source: 'bdsplanet',
            cuCode: cuCode,
            articles
        });

    } catch (error) {
        console.error('Error fetching news:', error);
        return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 });
    }
}
