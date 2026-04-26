import axios from 'axios';
import { getVisitorId } from '../utils/visitorId';

const visitorId = getVisitorId();

if (visitorId) {
    axios.defaults.headers.common['X-Visitor-ID'] = visitorId;
}

export default axios;
