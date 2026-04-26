import { v4 as uuidv4 } from 'uuid';

const VISITOR_ID_KEY = 'sl_vid';

export function getVisitorId() {
    if (typeof window === 'undefined' || !window.localStorage) {
        return null;
    }

    const existingVisitorId = window.localStorage.getItem(VISITOR_ID_KEY);

    if (existingVisitorId) {
        return existingVisitorId;
    }

    const visitorId = uuidv4();
    window.localStorage.setItem(VISITOR_ID_KEY, visitorId);

    return visitorId;
}

