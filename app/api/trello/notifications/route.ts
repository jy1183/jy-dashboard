import { NextResponse } from 'next/server';
import axios from 'axios';

const TRELLO_API_KEY = process.env.TRELLO_API_KEY;
const TRELLO_API_TOKEN = process.env.TRELLO_API_TOKEN;

export async function GET(request: Request) {
    if (!TRELLO_API_KEY || !TRELLO_API_TOKEN) {
        return NextResponse.json({ error: 'Trello API credentials not configured' }, { status: 500 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const limit = searchParams.get('limit') || '20';

        const res = await axios.get(
            `https://api.trello.com/1/members/me/notifications?key=${TRELLO_API_KEY}&token=${TRELLO_API_TOKEN}&limit=${limit}&read_filter=all&fields=id,type,date,unread,data`
        );

        const notifications = res.data.map((n: any) => ({
            id: n.id,
            type: n.type,
            date: n.date,
            unread: n.unread,
            // Extract readable info from data
            boardName: n.data?.board?.name || '',
            cardName: n.data?.card?.name || '',
            listName: n.data?.list?.name || '',
            text: n.data?.text || '',
            memberName: n.data?.memberCreator?.fullName || n.data?.member?.name || '',
            cardUrl: n.data?.card?.id
                ? `https://trello.com/c/${n.data.card.shortLink || n.data.card.id}`
                : '',
        }));

        // Count unread
        const unreadCount = notifications.filter((n: any) => n.unread).length;

        return NextResponse.json({ notifications, unreadCount });
    } catch (error: any) {
        console.error('Error fetching Trello Notifications:', error.response?.data || error.message);
        return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
    }
}

// Mark notifications as read
export async function PUT(request: Request) {
    if (!TRELLO_API_KEY || !TRELLO_API_TOKEN) {
        return NextResponse.json({ error: 'Trello API credentials not configured' }, { status: 500 });
    }

    try {
        await axios.post(
            `https://api.trello.com/1/notifications/all/read?key=${TRELLO_API_KEY}&token=${TRELLO_API_TOKEN}`
        );
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error marking notifications as read:', error.response?.data || error.message);
        return NextResponse.json({ error: 'Failed to mark as read' }, { status: 500 });
    }
}
