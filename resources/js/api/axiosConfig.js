import axios from 'axios';
import { hasAnalyticsConsent } from '../utils/consent';
import { getVisitorId } from '../utils/visitorId';

const applyVisitorHeader = () => {
    if (!hasAnalyticsConsent()) {
        delete axios.defaults.headers.common['X-Visitor-ID'];
        return;
    }

    const visitorId = getVisitorId();
    if (visitorId) {
        axios.defaults.headers.common['X-Visitor-ID'] = visitorId;
    }
};

applyVisitorHeader();

if (typeof window !== 'undefined') {
    window.addEventListener('yaadlink:consent-changed', applyVisitorHeader);
}

export default axios;
