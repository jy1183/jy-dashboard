import { NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';

export async function GET() {
    try {
        const url = 'https://apply.lh.or.kr/lhapply/apply/pch/list.do?mi=1076';

        // LH often requires specific headers
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            }
        });

        const $ = cheerio.load(response.data);
        const notices: any[] = [];

        // Selector based on inspection of lh.html (table rows usually in .tbl_list tbody or similar)
        // We look for the main list table. Since we don't have the exact class from the raw html dump (it was truncated),
        // we assume standard LH table structure: tbody > tr
        // Depending on the "temp_html" inspection, we search for common patterns.
        // Let's try to be generic: find 'tbody' and iterate rows.

        $('tbody tr').each((i, el) => {
            // Typically: [State] [Type] [Title] [Date] ...
            // We'll extract text from cells
            const cells = $(el).find('td');
            if (cells.length > 0) {
                const titleEl = $(cells).find('.tit a').first();
                // Fallback to 3rd column (index 2) if .tit logic fails
                let title = titleEl.text().trim();
                if (!title) {
                    title = $(cells).eq(2).text().trim();
                }

                const link = titleEl.attr('href') || '#';

                // Extract dates using regex from all cell text to be safe
                const rowText = $(el).text();
                // Match YYYY-MM-DD or YYYY.MM.DD
                const dateMatches = rowText.match(/(\d{4}[.-]\d{2}[.-]\d{2})/g);
                const noticeDate = dateMatches && dateMatches.length > 0 ? dateMatches[0] : '-';
                const deadline = dateMatches && dateMatches.length > 1 ? dateMatches[1] : '-';

                // State is typically in the first or second cell, looking for specific keywords
                const state = $(cells).eq(0).text().trim() || $(cells).eq(1).text().trim();

                let finalLink = link;
                if (link === '#') {
                    finalLink = 'https://apply.lh.or.kr/lhapply/apply/pch/list.do?mi=1076';
                } else if (link.startsWith('/')) {
                    finalLink = `https://apply.lh.or.kr${link}`;
                } else if (link.toLowerCase().startsWith('javascript:')) {
                    finalLink = 'https://apply.lh.or.kr/lhapply/apply/pch/list.do?mi=1076';
                }

                if (title) {
                    notices.push({
                        title,
                        link: finalLink,
                        noticeDate,
                        deadline,
                        state
                    });
                }
            }
        });

        return NextResponse.json({
            source: 'lh',
            notices: notices.slice(0, 5) // Limit to top 5
        });

    } catch (error) {
        console.error('Error fetching LH notices:', error);
        return NextResponse.json({ error: 'Failed to fetch LH data' }, { status: 500 });
    }
}
