import { NextResponse } from 'next/server';
import axios from 'axios';
import cal from 'node-ical';

const ICS_URLS = [
    'https://trello.com/calendar/56678936919d9e1ab6178abc/65fbd45844a48a2ef848216b/df2f185837cff2f28173534e54c10309.ics',
    'https://trello.com/calendar/56678936919d9e1ab6178abc/6620e3a546695f4a59fc2a4a/b2e739ec9364d78c574c4b0b6a679ebc.ics',
    'https://trello.com/calendar/56678936919d9e1ab6178abc/6641afa677b06f22d9ff00dc/da39c2c575c854e707efc6a49cd4abad.ics',
    'https://trello.com/calendar/56678936919d9e1ab6178abc/61d248c5f43a3874cb890d85/d9fc9bdd3336f8f107b0e114554822fc.ics'
];

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const rangeDays = parseInt(searchParams.get('days') || '1', 10);

        const allEvents: any[] = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const endDate = new Date(today);
        endDate.setDate(endDate.getDate() + rangeDays);

        // Fetch all ICS files in parallel
        const responses = await Promise.all(
            ICS_URLS.map(url => axios.get(url, { responseType: 'text' }))
        );

        responses.forEach(response => {
            const events = cal.parseICS(response.data);

            for (const k in events) {
                if (events.hasOwnProperty(k)) {
                    const ev = events[k];
                    if (ev.type === 'VEVENT') {
                        const startDate = new Date(ev.start);
                        
                        if (startDate >= today && startDate < endDate) {
                            allEvents.push({
                                title: ev.summary,
                                start: startDate,
                                end: ev.end,
                                description: ev.description || '', // Ensure string for displaying as "Card Name"
                                location: ev.location,
                                dayIndex: Math.floor((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) // 0 = today, 1 = tomorrow...
                            });
                        }
                    }
                }
            }
        });
        
        // Sort by date
        allEvents.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

        return NextResponse.json({
            source: 'trello',
            date: today.toISOString().split('T')[0],
            tasks: allEvents
        });

    } catch (error) {
        console.error('Error fetching Trello ICS:', error);
        return NextResponse.json({ error: 'Failed to fetch Trello tasks' }, { status: 500 });
    }
}
